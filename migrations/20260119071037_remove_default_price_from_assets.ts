import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("assets_pln", (table) => {
    table.dropColumn("default_price");
  });

  await knex.schema.alterTable("assets_orbit", (table) => {
    table.dropColumn("default_price");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("assets_pln", (table) => {
    table.decimal("default_price", 14, 2).defaultTo(100000);
  });

  await knex.schema.alterTable("assets_orbit", (table) => {
    table.decimal("default_price", 14, 2).defaultTo(135000);
  });
}
