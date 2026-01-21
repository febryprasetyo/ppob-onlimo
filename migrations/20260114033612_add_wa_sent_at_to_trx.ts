import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("trx_pln", (table) => {
    table.timestamp("wa_sent_at").nullable();
  });
  await knex.schema.alterTable("trx_orbit", (table) => {
    table.timestamp("wa_sent_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("trx_orbit", (table) => {
    table.dropColumn("wa_sent_at");
  });
  await knex.schema.alterTable("trx_pln", (table) => {
    table.dropColumn("wa_sent_at");
  });
}
