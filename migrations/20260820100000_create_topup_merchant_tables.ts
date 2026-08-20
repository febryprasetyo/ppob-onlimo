import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. topup_products: Isolated catalog for Topup Merchant MVP
  await knex.schema.createTable("topup_products", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("sku").notNullable().unique().comment("Digiflazz Buyer SKU code / external code");
    table.string("name").notNullable();
    table.enum("category", ["PULSA", "PAKET_DATA", "EMONEY", "PLN_TOKEN", "INTERNET_BILL"]).notNullable();
    table.string("brand").notNullable().comment("Provider / Brand e.g. TELKOMSEL, DANA, PLN");
    table.enum("flow_type", ["PREPAID", "POSTPAID"]).notNullable();
    table.enum("nominal_type", ["FIXED", "VARIABLE"]).notNullable().defaultTo("FIXED");
    table.decimal("catalog_price", 14, 2).defaultTo(0).notNullable();
    table.decimal("catalog_admin", 14, 2).defaultTo(0).notNullable();
    table.decimal("catalog_commission", 14, 2).defaultTo(0).notNullable();
    table.string("seller_name").nullable();
    table.boolean("is_active").defaultTo(true).notNullable();
    table.text("description").nullable();
    table.timestamp("source_updated_at").nullable();
    table.timestamp("imported_at").defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.index(["category", "is_active"]);
    table.index(["brand", "is_active"]);
  });

  // 2. topup_product_limits: Limits for variable nominal products (e.g. E-money bebas nominal)
  await knex.schema.createTable("topup_product_limits", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("product_id").notNullable().references("id").inTable("topup_products").onDelete("CASCADE");
    table.decimal("min_amount", 14, 2).defaultTo(10000).notNullable();
    table.decimal("max_amount", 14, 2).defaultTo(10000000).notNullable();
    table.decimal("increment_amount", 14, 2).defaultTo(1000).notNullable();
    table.string("currency", 3).defaultTo("IDR").notNullable();
    table.timestamps(true, true);
  });

  // 3. topup_inquiries: Snapshot for postpaid / variable amount inquiry prior to payment
  await knex.schema.createTable("topup_inquiries", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("supplier_ref_id").notNullable().comment("Unique ref_id generated for Digiflazz inquiry");
    table.uuid("product_id").nullable().references("id").inTable("topup_products").onDelete("SET NULL");
    table.string("sku").notNullable();
    table.string("category").notNullable();
    table.string("customer_target").notNullable();
    table.string("customer_name").nullable();
    table.decimal("input_amount", 14, 2).nullable().comment("Input amount for variable nominal e-money");
    table.decimal("final_price", 14, 2).notNullable().comment("selling_price from Digiflazz");
    table.decimal("deposit_price", 14, 2).notNullable().comment("price (deposit deduction) from Digiflazz");
    table.decimal("admin_fee", 14, 2).defaultTo(0).notNullable();
    table.decimal("commission", 14, 2).defaultTo(0).notNullable();
    table.string("bill_period").nullable();
    table.jsonb("detail_snapshot").nullable();
    table.enum("status", ["CHECKED", "USED", "EXPIRED"]).defaultTo("CHECKED").notNullable();
    table.date("inquiry_date").notNullable().comment("Calendar date in Asia/Jakarta timezone");
    table.string("operator_username").notNullable();
    table.jsonb("raw_response").nullable();
    table.timestamp("expires_at").notNullable().comment("Max 15 minutes from created_at");
    table.timestamps(true, true);

    table.index(["supplier_ref_id"]);
    table.index(["status", "expires_at"]);
  });

  // 4. topup_transactions: Master transaction table for all 5 services
  await knex.schema.createTable("topup_transactions", (table) => {
    table.string("reference").primary().comment("Format: TOP-YYYYMMDD-XXXXXX");
    table.uuid("product_id").nullable().references("id").inTable("topup_products").onDelete("SET NULL");
    table.uuid("inquiry_id").nullable().references("id").inTable("topup_inquiries").onDelete("SET NULL");
    table.string("idempotency_key").notNullable();
    table.enum("category", ["PULSA", "PAKET_DATA", "EMONEY", "PLN_TOKEN", "INTERNET_BILL"]).notNullable();
    table.enum("flow_type", ["PREPAID", "POSTPAID"]).notNullable();
    table.string("customer_target").notNullable();
    table.jsonb("product_snapshot").notNullable().comment("Snapshot of product name, SKU, category at execution");
    table.decimal("final_price_snapshot", 14, 2).notNullable().comment("Price charged to customer/UI");
    table.decimal("deposit_price_snapshot", 14, 2).notNullable().comment("Supplier cost / deposit deducted");
    table.decimal("admin_snapshot", 14, 2).defaultTo(0).notNullable();
    table.decimal("commission_snapshot", 14, 2).defaultTo(0).notNullable();
    table.enum("status", ["SUBMITTED", "PENDING", "SUCCESS", "FAILED"]).defaultTo("SUBMITTED").notNullable();
    table.string("operator_username").notNullable();
    table.string("supplier_reference").nullable().comment("Serial Number or Supplier Ref ID");
    table.string("serial_number").nullable().comment("SN from supplier");
    table.string("token").nullable().comment("20-digit PLN Token if applicable");
    table.string("supplier_message").nullable();
    table.jsonb("raw_response").nullable();
    table.timestamp("submitted_at").defaultTo(knex.fn.now());
    table.timestamp("completed_at").nullable();
    table.timestamps(true, true);

    table.unique(["operator_username", "idempotency_key"]);
    table.index(["status", "created_at"]);
    table.index(["category", "created_at"]);
    table.index(["customer_target"]);
  });

  // 5. topup_transaction_events: Audit log for transaction state transitions
  await knex.schema.createTable("topup_transaction_events", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("transaction_reference").notNullable().references("reference").inTable("topup_transactions").onDelete("CASCADE");
    table.string("event_type").notNullable().comment("e.g. SUBMITTED, SUPPLIER_RESPONSE, STATUS_CHECK, COMPLETED");
    table.string("old_status").nullable();
    table.string("new_status").notNullable();
    table.string("actor").notNullable();
    table.jsonb("payload_redacted").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.index(["transaction_reference"]);
  });

  // 6. topup_catalog_imports: Audit log for CSV catalog imports
  await knex.schema.createTable("topup_catalog_imports", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("source_filename").notNullable();
    table.integer("row_count").defaultTo(0).notNullable();
    table.integer("accepted_count").defaultTo(0).notNullable();
    table.integer("rejected_count").defaultTo(0).notNullable();
    table.jsonb("error_report").nullable();
    table.string("imported_by").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("topup_transaction_events");
  await knex.schema.dropTableIfExists("topup_transactions");
  await knex.schema.dropTableIfExists("topup_inquiries");
  await knex.schema.dropTableIfExists("topup_product_limits");
  await knex.schema.dropTableIfExists("topup_products");
  await knex.schema.dropTableIfExists("topup_catalog_imports");
}
