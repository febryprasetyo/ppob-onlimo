import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. invoices
  await knex.schema.createTable("invoices", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("invoice_no").notNullable().unique();
    table.date("period").notNullable().comment("Bulan/Tahun Periode");
    table.decimal("total_amount", 14, 2).notNullable();
    table.enum("status", ["UNPAID", "PAID", "CANCELLED"]).defaultTo("UNPAID");
    table.timestamps(true, true);
  });

  // 2. invoice_items
  await knex.schema.createTable("invoice_items", (table) => {
    table.increments("id").primary();
    table.uuid("invoice_id").notNullable().references("id").inTable("invoices").onDelete("CASCADE");
    table.string("category").notNullable().comment("PLN, ORBIT, ADMIN, etc");
    table.string("description").notNullable();
    table.integer("quantity").defaultTo(1);
    table.decimal("unit_price", 14, 2).notNullable();
    table.decimal("total_price", 14, 2).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("invoice_items");
  await knex.schema.dropTableIfExists("invoices");
}
