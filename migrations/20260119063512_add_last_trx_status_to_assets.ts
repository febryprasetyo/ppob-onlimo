import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("assets_pln", (table) => {
    table.string("last_trx_status").nullable();
    table.timestamp("last_trx_at").nullable();
  });

  await knex.schema.alterTable("assets_orbit", (table) => {
    table.string("last_trx_status").nullable();
    table.timestamp("last_trx_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("assets_pln", (table) => {
    table.dropColumn("last_trx_status");
    table.dropColumn("last_trx_at");
  });

  await knex.schema.alterTable("assets_orbit", (table) => {
    table.dropColumn("last_trx_status");
    table.dropColumn("last_trx_at");
  });
}
