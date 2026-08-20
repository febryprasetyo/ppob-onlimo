import { DIGIFLAZZ_CONFIG } from "../digiflazz-config";
import { getDigiflazzSign } from "../digiflazz-signer";
import { SupplierResult, BillInquiryResult, PlnInquiryResult, TopupTransactionStatus } from "./types";

const DF_USER = DIGIFLAZZ_CONFIG.username;
const DF_KEY = DIGIFLAZZ_CONFIG.apiKey;
const IS_PROD = DIGIFLAZZ_CONFIG.isProd;

export interface SupplierAdapter {
  purchasePrepaid(params: { sku: string; customerNo: string; refId: string }): Promise<SupplierResult>;
  inquireBill(params: { sku: string; customerNo: string; refId: string; amount?: number }): Promise<BillInquiryResult>;
  payBill(params: { sku: string; customerNo: string; refId: string }): Promise<SupplierResult>;
  inquirePln(params: { customerNo: string }): Promise<PlnInquiryResult>;
  checkStatus(params: { sku: string; customerNo: string; refId: string; flowType?: "PREPAID" | "POSTPAID" }): Promise<SupplierResult>;
}

export class DigiflazzSupplierAdapter implements SupplierAdapter {
  private generateSign(ref: string): string {
    return getDigiflazzSign(ref);
  }

  async purchasePrepaid({ sku, customerNo, refId }: { sku: string; customerNo: string; refId: string }): Promise<SupplierResult> {
    const cleanCustomerNo = customerNo.trim();
    const sign = this.generateSign(refId);

    const payload: any = {
      username: DF_USER,
      buyer_sku_code: sku,
      customer_no: cleanCustomerNo,
      ref_id: refId,
      sign: sign,
    };

    if (!IS_PROD) {
      payload.testing = true;
    }

    try {
      const response = await fetch("https://api.digiflazz.com/v1/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await response.json();
      const data = resJson.data || {};

      let status: TopupTransactionStatus = "PENDING";
      if (data.rc === "00" || data.status === "Sukses" || data.status === "Success") {
        status = "SUCCESS";
      } else if (data.rc === "01" || data.rc === "02" || data.rc === "03") {
        status = "FAILED";
      }

      return {
        success: status === "SUCCESS",
        status,
        rc: data.rc,
        message: data.message || resJson.message || "Transaksi terkirim",
        sn: data.sn || null,
        token: (data.sn && data.sn.length === 20 && /^\d+$/.test(data.sn)) ? data.sn : null,
        price: data.price || 0,
        raw: resJson,
      };
    } catch (error: any) {
      console.error("[Digiflazz Prepaid] Connection Error:", error);
      return {
        success: false,
        status: "PENDING",
        message: error.message || "Gagal menghubungi supplier (Timeout/Network Error)",
        raw: { error: error.message },
      };
    }
  }

  async inquireBill({
    sku,
    customerNo,
    refId,
    amount,
  }: {
    sku: string;
    customerNo: string;
    refId: string;
    amount?: number;
  }): Promise<BillInquiryResult> {
    const cleanCustomerNo = customerNo.trim();
    const sign = this.generateSign(refId);

    const payload: any = {
      commands: "inq-pasca",
      username: DF_USER,
      buyer_sku_code: sku,
      customer_no: cleanCustomerNo,
      ref_id: refId,
      sign: sign,
    };

    if (amount && amount > 0) {
      payload.amount = amount;
    }

    if (!IS_PROD) {
      payload.testing = true;
    }

    try {
      const response = await fetch("https://api.digiflazz.com/v1/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await response.json();
      const data = resJson.data || {};

      // Check success
      const isSuccess = data.rc === "00" || data.status === "Sukses" || data.status === "Success";

      // If testing mode & dev key doesn't have postpaid sandbox enabled on Digiflazz,
      // provide safe simulation fallback so local dev / QA is smooth:
      if (!IS_PROD && !isSuccess && (data.rc === "41" || data.rc === "02" || resJson.message?.includes("Testing"))) {
        console.warn("[Digiflazz Inq-Pasca] DEV MODE: Simulating inquiry result for sandbox testing");
        const nominal = amount || 150000;
        const admin = 2500;
        const commission = 1275;
        const sellingPrice = nominal + admin;
        const depositPrice = sellingPrice - commission;

        return {
          success: true,
          rc: "00",
          message: "Tagihan ditemukan (Dev Sandbox)",
          customer_no: cleanCustomerNo,
          customer_name: "PELANGGAN DEMO ONLIMO",
          bill_period: new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
          admin,
          commission,
          price: depositPrice,
          selling_price: sellingPrice,
          details: {
            lembar_tagihan: 1,
            periode: new Date().toISOString().slice(0, 7),
            detail: [{ periode: new Date().toISOString().slice(0, 7), nilai_tagihan: nominal, admin }],
          },
          raw: { data: { simulated: true, selling_price: sellingPrice, price: depositPrice } },
        };
      }

      if (!isSuccess) {
        return {
          success: false,
          rc: data.rc,
          message: data.message || resJson.message || "Gagal memeriksa tagihan",
          customer_no: cleanCustomerNo,
          customer_name: "",
          price: 0,
          selling_price: 0,
          raw: resJson,
        };
      }

      return {
        success: true,
        rc: data.rc,
        message: data.message || "Inquiry berhasil",
        customer_no: data.customer_no || cleanCustomerNo,
        customer_name: data.customer_name || data.name || "PELANGGAN",
        bill_period: data.period || data.bill_period || null,
        admin: data.admin || 0,
        commission: data.commission || 0,
        price: data.price || 0, // Deposit deduction
        selling_price: data.selling_price || (data.price + (data.admin || 0)), // Customer final price
        details: data.desc || data,
        raw: resJson,
      };
    } catch (error: any) {
      console.error("[Digiflazz Inq-Pasca] Error:", error);
      throw new Error(error.message || "Gagal menghubungi supplier");
    }
  }

  async payBill({ sku, customerNo, refId }: { sku: string; customerNo: string; refId: string }): Promise<SupplierResult> {
    const cleanCustomerNo = customerNo.trim();
    const sign = this.generateSign(refId);

    const payload: any = {
      commands: "pay-pasca",
      username: DF_USER,
      buyer_sku_code: sku,
      customer_no: cleanCustomerNo,
      ref_id: refId,
      sign: sign,
    };

    if (!IS_PROD) {
      payload.testing = true;
    }

    try {
      const response = await fetch("https://api.digiflazz.com/v1/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await response.json();
      const data = resJson.data || {};

      let status: TopupTransactionStatus = "PENDING";
      if (data.rc === "00" || data.status === "Sukses" || data.status === "Success") {
        status = "SUCCESS";
      } else if (data.rc === "01" || data.rc === "02" || data.rc === "03") {
        status = "FAILED";
      }

      // Dev sandbox simulation fallback
      if (!IS_PROD && status === "FAILED" && (data.rc === "41" || data.rc === "02" || resJson.message?.includes("Testing"))) {
        return {
          success: true,
          status: "SUCCESS",
          rc: "00",
          message: "Pembayaran Berhasil (Dev Sandbox)",
          sn: `SN-${Date.now()}`,
          raw: { simulated: true, data },
        };
      }

      return {
        success: status === "SUCCESS",
        status,
        rc: data.rc,
        message: data.message || resJson.message || "Pembayaran tagihan diproses",
        sn: data.sn || null,
        price: data.price || 0,
        selling_price: data.selling_price || 0,
        raw: resJson,
      };
    } catch (error: any) {
      console.error("[Digiflazz Pay-Pasca] Error:", error);
      return {
        success: false,
        status: "PENDING",
        message: error.message || "Koneksi ke supplier terputus saat pembayaran",
        raw: { error: error.message },
      };
    }
  }

  async inquirePln({ customerNo }: { customerNo: string }): Promise<PlnInquiryResult> {
    const cleanNo = customerNo.trim();
    const sign = this.generateSign(cleanNo);

    const payload: any = {
      username: DF_USER,
      customer_no: cleanNo,
      sign: sign,
    };

    if (!IS_PROD) {
      payload.testing = true;
    }

    try {
      const response = await fetch("https://api.digiflazz.com/v1/inquiry-pln", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await response.json();
      const data = resJson.data || {};

      const isSuccess = data.rc === "00" || data.status === "Sukses" || data.status === "Success";

      // Dev sandbox fallback
      if (!IS_PROD && !isSuccess && (data.rc === "41" || data.rc === "02")) {
        return {
          success: true,
          rc: "00",
          message: "ID Pelanggan Terverifikasi (Dev Sandbox)",
          customer_no: cleanNo,
          meter_no: cleanNo,
          subscriber_id: cleanNo,
          name: "PELANGGAN PLN DEMO",
          segment_power: "R1M / 900 VA",
          raw: { simulated: true, data },
        };
      }

      return {
        success: isSuccess,
        rc: data.rc,
        message: data.message || resJson.message || (isSuccess ? "ID Pelanggan Ditemukan" : "ID Pelanggan Tidak Ditemukan"),
        customer_no: data.customer_no || cleanNo,
        meter_no: data.meter_no,
        subscriber_id: data.subscriber_id,
        name: data.name || "",
        segment_power: data.segment_power || "",
        raw: resJson,
      };
    } catch (error: any) {
      console.error("[Digiflazz PLN Inquiry] Error:", error);
      throw new Error(error.message || "Gagal memeriksa ID PLN ke supplier");
    }
  }

  async checkStatus({
    sku,
    customerNo,
    refId,
    flowType = "PREPAID",
  }: {
    sku: string;
    customerNo: string;
    refId: string;
    flowType?: "PREPAID" | "POSTPAID";
  }): Promise<SupplierResult> {
    const cleanCustomerNo = customerNo.trim();
    const sign = this.generateSign(refId);

    const payload: any = {
      username: DF_USER,
      buyer_sku_code: sku,
      customer_no: cleanCustomerNo,
      ref_id: refId,
      sign: sign,
    };

    if (flowType === "POSTPAID") {
      payload.commands = "status-pasca";
    }

    if (!IS_PROD) {
      payload.testing = true;
    }

    try {
      const response = await fetch("https://api.digiflazz.com/v1/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await response.json();
      const data = resJson.data || {};

      let status: TopupTransactionStatus = "PENDING";
      if (data.rc === "00" || data.status === "Sukses" || data.status === "Success") {
        status = "SUCCESS";
      } else if (data.rc === "01" || data.rc === "02" || data.rc === "03") {
        status = "FAILED";
      }

      return {
        success: status === "SUCCESS",
        status,
        rc: data.rc,
        message: data.message || resJson.message || `Status: ${status}`,
        sn: data.sn || null,
        token: (data.sn && data.sn.length === 20 && /^\d+$/.test(data.sn)) ? data.sn : null,
        price: data.price,
        raw: resJson,
      };
    } catch (error: any) {
      console.error("[Digiflazz Status Check] Error:", error);
      return {
        success: false,
        status: "PENDING",
        message: error.message || "Gagal menghubungi supplier untuk cek status",
        raw: { error: error.message },
      };
    }
  }
}

export const digiflazzAdapter = new DigiflazzSupplierAdapter();
