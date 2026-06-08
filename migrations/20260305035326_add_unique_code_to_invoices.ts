import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("invoices", (table) => {
    table.integer("unique_code").defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("invoices", (table) => {
    table.dropColumn("unique_code");
  });
}

