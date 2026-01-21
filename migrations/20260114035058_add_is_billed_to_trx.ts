import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("trx_pln", (table) => {
    table.boolean("is_billed").defaultTo(false).notNullable();
  });
  await knex.schema.alterTable("trx_orbit", (table) => {
    table.boolean("is_billed").defaultTo(false).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("trx_orbit", (table) => {
    table.dropColumn("is_billed");
  });
  await knex.schema.alterTable("trx_pln", (table) => {
    table.dropColumn("is_billed");
  });
}
