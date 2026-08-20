import db from "../db";
import { digiflazzAdapter, SupplierAdapter } from "./supplier-adapter";
import { TopupProduct, TopupInquiry, TopupTransaction, TopupTransactionStatus } from "./types";

export class TopupOrchestrator {
  private adapter: SupplierAdapter;

  constructor(adapter: SupplierAdapter = digiflazzAdapter) {
    this.adapter = adapter;
  }

  // Get current date string in Asia/Jakarta (WIB) YYYY-MM-DD
  private getJakartaDateString(date: Date | string = new Date()): string {
    const d = typeof date === "string" ? new Date(date) : (date instanceof Date ? date : new Date(date));
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(d); // Output: YYYY-MM-DD
  }

  // Generate Reference ID: TOP-YYYYMMDD-XXXXXX
  private generateReference(): string {
    const now = new Date();
    const jakartaDate = this.getJakartaDateString(now).replace(/-/g, "");
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `TOP-${jakartaDate}-${randomSuffix}`;
  }

  // Generate Inquiry Ref ID: INQ-YYYYMMDD-XXXXXX
  private generateInquiryRefId(): string {
    const now = new Date();
    const jakartaDate = this.getJakartaDateString(now).replace(/-/g, "");
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `INQ-${jakartaDate}-${randomSuffix}`;
  }

  /**
   * 1. Create Prepaid Transaction
   */
  async processPrepaidTransaction(params: {
    productId: string;
    customerTarget: string;
    idempotencyKey: string;
    operatorUsername: string;
  }): Promise<{ success: boolean; transaction: TopupTransaction; message: string }> {
    const { productId, customerTarget, idempotencyKey, operatorUsername } = params;

    const cleanTarget = customerTarget.trim().replace(/\D/g, "");
    if (!cleanTarget) {
      throw new Error("Nomor / ID tujuan tidak valid");
    }

    // 1. Idempotency Check
    const existing = await db("topup_transactions")
      .where({
        operator_username: operatorUsername,
        idempotency_key: idempotencyKey,
      })
      .first();

    if (existing) {
      return {
        success: existing.status === "SUCCESS",
        transaction: existing,
        message: "Mengembalikan transaksi yang sudah ada (Idempoten)",
      };
    }

    // 2. Fetch Active Product
    const product: TopupProduct = await db("topup_products").where({ id: productId, is_active: true }).first();
    if (!product) {
      throw new Error("Produk tidak ditemukan atau sedang tidak aktif");
    }

    if (product.flow_type !== "PREPAID") {
      throw new Error("Produk ini adalah produk pascabayar/inquiry. Gunakan alur inquiry terlebih dahulu.");
    }

    const reference = this.generateReference();
    const productSnapshot = {
      name: product.name,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      nominal_type: product.nominal_type,
    };

    const finalPrice = Number(product.catalog_price);
    const depositPrice = finalPrice; // On prepaid, catalog_price is the cost/final price

    // 3. Insert Transaction with SUBMITTED status
    await db.transaction(async (trx) => {
      await trx("topup_transactions").insert({
        reference,
        product_id: product.id,
        inquiry_id: null,
        idempotency_key: idempotencyKey,
        category: product.category,
        flow_type: "PREPAID",
        customer_target: cleanTarget,
        product_snapshot: JSON.stringify(productSnapshot),
        final_price_snapshot: finalPrice,
        deposit_price_snapshot: depositPrice,
        admin_snapshot: 0,
        commission_snapshot: 0,
        status: "SUBMITTED",
        operator_username: operatorUsername,
        submitted_at: trx.fn.now(),
      });

      await trx("topup_transaction_events").insert({
        transaction_reference: reference,
        event_type: "SUBMITTED",
        old_status: null,
        new_status: "SUBMITTED",
        actor: operatorUsername,
        payload_redacted: JSON.stringify({ sku: product.sku, target: cleanTarget }),
      });
    });

    // 4. Call Supplier
    const result = await this.adapter.purchasePrepaid({
      sku: product.sku,
      customerNo: cleanTarget,
      refId: reference,
    });

    // 5. Update Status Atomically
    let updatedTx: TopupTransaction;
    await db.transaction(async (trx) => {
      const now = new Date();
      await trx("topup_transactions")
        .where({ reference })
        .update({
          status: result.status,
          supplier_reference: result.sn || result.rc || null,
          serial_number: result.sn || null,
          token: result.token || null,
          supplier_message: result.message,
          raw_response: JSON.stringify(result.raw),
          completed_at: result.status !== "PENDING" ? trx.fn.now() : null,
          updated_at: trx.fn.now(),
        });

      await trx("topup_transaction_events").insert({
        transaction_reference: reference,
        event_type: "SUPPLIER_RESPONSE",
        old_status: "SUBMITTED",
        new_status: result.status,
        actor: "SUPPLIER_ADAPTER",
        payload_redacted: JSON.stringify({ rc: result.rc, message: result.message }),
      });

      updatedTx = await trx("topup_transactions").where({ reference }).first();
    });

    return {
      success: result.status === "SUCCESS",
      transaction: updatedTx!,
      message: result.message,
    };
  }

  /**
   * 2. Bill Inquiry (IndiHome & E-Money Bebas Nominal)
   */
  async processBillInquiry(params: {
    productId: string;
    customerTarget: string;
    amount?: number;
    operatorUsername: string;
  }): Promise<{ success: boolean; inquiry: TopupInquiry; message: string }> {
    const { productId, customerTarget, amount, operatorUsername } = params;

    const cleanTarget = customerTarget.trim().replace(/\D/g, "");
    if (!cleanTarget) {
      throw new Error("Nomor / ID tujuan tidak valid");
    }

    const product: TopupProduct = await db("topup_products").where({ id: productId, is_active: true }).first();
    if (!product) {
      throw new Error("Produk tidak ditemukan atau tidak aktif");
    }

    // Check limits for variable nominal
    if (product.nominal_type === "VARIABLE" && product.category === "EMONEY") {
      if (!amount || amount <= 0) {
        throw new Error("Nominal top-up e-money wajib diisi");
      }
      const limits = await db("topup_product_limits").where({ product_id: product.id }).first();
      const min = limits?.min_amount || 10000;
      const max = limits?.max_amount || 10000000;
      const inc = limits?.increment_amount || 1000;

      if (amount < min) throw new Error(`Nominal minimal adalah Rp ${min.toLocaleString("id-ID")}`);
      if (amount > max) throw new Error(`Nominal maksimal adalah Rp ${max.toLocaleString("id-ID")}`);
      if (amount % inc !== 0) throw new Error(`Nominal harus kelipatan Rp ${inc.toLocaleString("id-ID")}`);
    }

    const supplierRefId = this.generateInquiryRefId();
    const todayJakarta = this.getJakartaDateString(new Date());

    // Call Supplier Inquiry
    const result = await this.adapter.inquireBill({
      sku: product.sku,
      customerNo: cleanTarget,
      refId: supplierRefId,
      amount,
    });

    if (!result.success) {
      throw new Error(result.message || "Gagal melakukan inquiry tagihan ke supplier");
    }

    // Expiry: 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const [inquiry] = await db("topup_inquiries")
      .insert({
        supplier_ref_id: supplierRefId,
        product_id: product.id,
        sku: product.sku,
        category: product.category,
        customer_target: cleanTarget,
        customer_name: result.customer_name || "PELANGGAN",
        input_amount: amount || null,
        final_price: result.selling_price,
        deposit_price: result.price,
        admin_fee: result.admin || product.catalog_admin || 0,
        commission: result.commission || product.catalog_commission || 0,
        bill_period: result.bill_period || null,
        detail_snapshot: JSON.stringify(result.details || {}),
        status: "CHECKED",
        inquiry_date: todayJakarta,
        operator_username: operatorUsername,
        raw_response: JSON.stringify(result.raw),
        expires_at: expiresAt,
      })
      .returning("*");

    return {
      success: true,
      inquiry,
      message: result.message,
    };
  }

  /**
   * 3. Process Bill Payment (IndiHome & E-Money Bebas Nominal)
   */
  async processBillPayment(params: {
    inquiryId: string;
    idempotencyKey: string;
    operatorUsername: string;
  }): Promise<{ success: boolean; transaction: TopupTransaction; message: string }> {
    const { inquiryId, idempotencyKey, operatorUsername } = params;

    // Idempotency check
    const existing = await db("topup_transactions")
      .where({
        operator_username: operatorUsername,
        idempotency_key: idempotencyKey,
      })
      .first();

    if (existing) {
      return {
        success: existing.status === "SUCCESS",
        transaction: existing,
        message: "Mengembalikan transaksi yang sudah ada (Idempoten)",
      };
    }

    const inquiry: TopupInquiry = await db("topup_inquiries").where({ id: inquiryId }).first();
    if (!inquiry) {
      throw new Error("Data inquiry tagihan tidak ditemukan");
    }

    if (inquiry.status === "USED") {
      throw new Error("Inquiry tagihan ini sudah pernah dibayar");
    }

    // Check expiration (15 minutes)
    if (new Date() > new Date(inquiry.expires_at)) {
      await db("topup_inquiries").where({ id: inquiry.id }).update({ status: "EXPIRED" });
      throw new Error("Waktu berlaku inquiry telah habis (melebihi 15 menit). Silakan lakukan cek tagihan ulang.");
    }

    // Check same calendar day in Jakarta WIB
    const todayJakarta = this.getJakartaDateString(new Date());
    const inquiryDateStr = this.getJakartaDateString(inquiry.inquiry_date || inquiry.created_at);
    if (inquiryDateStr !== todayJakarta) {
      await db("topup_inquiries").where({ id: inquiry.id }).update({ status: "EXPIRED" });
      throw new Error("Tanggal inquiry berbeda dengan tanggal hari ini. Supplier mewajibkan pembayaran pada tanggal kalender yang sama. Silakan lakukan cek tagihan ulang.");
    }

    const product: TopupProduct = await db("topup_products").where({ id: inquiry.product_id }).first();
    const reference = inquiry.supplier_ref_id; // Digiflazz requires identical ref_id for pay-pasca

    const productSnapshot = {
      name: product ? product.name : inquiry.category,
      sku: inquiry.sku,
      category: inquiry.category,
      brand: product ? product.brand : inquiry.category,
      nominal_type: "VARIABLE",
    };

    // Insert SUBMITTED and mark inquiry USED atomically
    await db.transaction(async (trx) => {
      await trx("topup_inquiries").where({ id: inquiry.id }).update({ status: "USED", updated_at: trx.fn.now() });

      await trx("topup_transactions").insert({
        reference,
        product_id: inquiry.product_id,
        inquiry_id: inquiry.id,
        idempotency_key: idempotencyKey,
        category: inquiry.category,
        flow_type: "POSTPAID",
        customer_target: inquiry.customer_target,
        product_snapshot: JSON.stringify(productSnapshot),
        final_price_snapshot: inquiry.final_price,
        deposit_price_snapshot: inquiry.deposit_price,
        admin_snapshot: inquiry.admin_fee,
        commission_snapshot: inquiry.commission,
        status: "SUBMITTED",
        operator_username: operatorUsername,
        submitted_at: trx.fn.now(),
      });

      await trx("topup_transaction_events").insert({
        transaction_reference: reference,
        event_type: "SUBMITTED",
        old_status: null,
        new_status: "SUBMITTED",
        actor: operatorUsername,
        payload_redacted: JSON.stringify({ inquiry_id: inquiry.id, sku: inquiry.sku }),
      });
    });

    // Call Supplier Pay-Pasca
    const result = await this.adapter.payBill({
      sku: inquiry.sku,
      customerNo: inquiry.customer_target,
      refId: inquiry.supplier_ref_id,
    });

    let updatedTx: TopupTransaction;
    await db.transaction(async (trx) => {
      await trx("topup_transactions")
        .where({ reference })
        .update({
          status: result.status,
          supplier_reference: result.sn || result.rc || null,
          serial_number: result.sn || null,
          supplier_message: result.message,
          raw_response: JSON.stringify(result.raw),
          completed_at: result.status !== "PENDING" ? trx.fn.now() : null,
          updated_at: trx.fn.now(),
        });

      await trx("topup_transaction_events").insert({
        transaction_reference: reference,
        event_type: "SUPPLIER_PAYMENT_RESPONSE",
        old_status: "SUBMITTED",
        new_status: result.status,
        actor: "SUPPLIER_ADAPTER",
        payload_redacted: JSON.stringify({ rc: result.rc, message: result.message }),
      });

      updatedTx = await trx("topup_transactions").where({ reference }).first();
    });

    return {
      success: result.status === "SUCCESS",
      transaction: updatedTx!,
      message: result.message,
    };
  }

  /**
   * 4. PLN Meter ID Check
   */
  async checkPlnSubscriber(customerNo: string) {
    const cleanNo = customerNo.trim().replace(/\D/g, "");
    if (!cleanNo || cleanNo.length < 10) {
      throw new Error("Nomor meter / ID pelanggan PLN minimal 10 digit angka");
    }
    return await this.adapter.inquirePln({ customerNo: cleanNo });
  }

  /**
   * 5. Reconcile Pending Transaction Status
   */
  async reconcilePendingStatus(reference: string): Promise<{ success: boolean; transaction: TopupTransaction; message: string }> {
    const tx: TopupTransaction = await db("topup_transactions").where({ reference }).first();
    if (!tx) {
      throw new Error("Transaksi tidak ditemukan");
    }

    if (tx.status !== "PENDING" && tx.status !== "SUBMITTED") {
      return {
        success: tx.status === "SUCCESS",
        transaction: tx,
        message: `Status transaksi sudah final: ${tx.status}`,
      };
    }

    const snapshot = typeof tx.product_snapshot === "string" ? JSON.parse(tx.product_snapshot) : tx.product_snapshot;
    const result = await this.adapter.checkStatus({
      sku: snapshot.sku,
      customerNo: tx.customer_target,
      refId: tx.reference,
      flowType: tx.flow_type,
    });

    let updatedTx = tx;
    if (result.status !== tx.status) {
      await db.transaction(async (trx) => {
        await trx("topup_transactions")
          .where({ reference })
          .update({
            status: result.status,
            supplier_reference: result.sn || tx.supplier_reference,
            serial_number: result.sn || tx.serial_number,
            token: result.token || tx.token,
            supplier_message: result.message,
            raw_response: JSON.stringify(result.raw),
            completed_at: result.status !== "PENDING" ? trx.fn.now() : null,
            updated_at: trx.fn.now(),
          });

        await trx("topup_transaction_events").insert({
          transaction_reference: reference,
          event_type: "STATUS_CHECK",
          old_status: tx.status,
          new_status: result.status,
          actor: "STATUS_RECONCILER",
          payload_redacted: JSON.stringify({ rc: result.rc, message: result.message }),
        });

        updatedTx = await trx("topup_transactions").where({ reference }).first();
      });
    }

    return {
      success: result.status === "SUCCESS",
      transaction: updatedTx,
      message: result.message,
    };
  }
}

export const topupOrchestrator = new TopupOrchestrator();
