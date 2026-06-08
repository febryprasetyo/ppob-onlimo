import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("trx_emoney", (table) => {
    table.string("ref_id").primary().unique().comment("Format: EMN-Timestamp");
    table.string("customer_no").notNullable().comment("Nomor HP Tujuan");
    table.string("product_name").notNullable();
    table.string("brand").notNullable();
    table.string("sku").notNullable();
    table.decimal("price", 14, 2).notNullable();
    table.enum("status", ["PENDING", "SUCCESS", "FAILED"]).defaultTo("PENDING");
    table.string("sn").nullable().comment("Serial Number / Ref from Digiflazz");
    table.string("message").nullable();
    table.text("raw_response").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("trx_emoney");
}
