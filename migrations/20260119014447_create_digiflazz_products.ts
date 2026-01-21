import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("digiflazz_products", (table) => {
    table.string("buyer_sku_code").primary().unique();
    table.string("product_name").notNullable();
    table.string("category").notNullable();
    table.string("brand").notNullable();
    table.string("type").notNullable();
    table.string("seller_name").nullable();
    table.integer("price").notNullable();
    table.boolean("buyer_product_status").defaultTo(true);
    table.boolean("seller_product_status").defaultTo(true);
    table.boolean("unlimited_stock").defaultTo(true);
    table.integer("stock").defaultTo(0);
    table.boolean("multi").defaultTo(false);
    table.string("start_cut_off").nullable();
    table.string("end_cut_off").nullable();
    table.text("desc").nullable();
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("digiflazz_products");
}
