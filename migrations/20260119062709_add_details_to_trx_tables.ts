import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("trx_pln", (table) => {
    table.text("message").nullable();
    table.jsonb("raw_response").nullable();
  });

  await knex.schema.alterTable("trx_orbit", (table) => {
    table.text("message").nullable();
    table.jsonb("raw_response").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("trx_pln", (table) => {
    table.dropColumn("message");
    table.dropColumn("raw_response");
  });

  await knex.schema.alterTable("trx_orbit", (table) => {
    table.dropColumn("message");
    table.dropColumn("raw_response");
  });
}
