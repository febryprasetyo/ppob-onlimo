import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("assets_pln", (table) => {
    table.string("default_sku").defaultTo("pln100");
    table.decimal("default_price", 14, 2).defaultTo(100000);
  });

  await knex.schema.alterTable("assets_orbit", (table) => {
    table.string("default_sku").defaultTo("orbit20");
    table.decimal("default_price", 14, 2).defaultTo(135000);
  });

  // Update existing data to have defaults
  await knex("assets_pln").update({ default_sku: "pln100", default_price: 100000 });
  await knex("assets_orbit").update({ default_sku: "orbit20", default_price: 135000 });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("assets_pln", (table) => {
    table.dropColumn("default_sku");
    table.dropColumn("default_price");
  });

  await knex.schema.alterTable("assets_orbit", (table) => {
    table.dropColumn("default_sku");
    table.dropColumn("default_price");
  });
}
