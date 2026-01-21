import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("assets_pln", (table) => {
    table.string("customer_name").nullable().after("meter_number");
    table.string("segment_power").nullable().after("customer_name");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("assets_pln", (table) => {
    table.dropColumn("customer_name");
    table.dropColumn("segment_power");
  });
}
