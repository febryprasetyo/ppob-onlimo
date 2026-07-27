import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("assets_pln", (table) => {
    table.string("provinsi").nullable();
    table.string("kabupaten").nullable();
    table.string("detail_lokasi").nullable();
    table.string("keterangan").nullable();
  });

  await knex.schema.alterTable("assets_orbit", (table) => {
    table.string("provinsi").nullable();
    table.string("kabupaten").nullable();
    table.string("detail_lokasi").nullable();
    table.string("keterangan").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("assets_pln", (table) => {
    table.dropColumn("provinsi");
    table.dropColumn("kabupaten");
    table.dropColumn("detail_lokasi");
    table.dropColumn("keterangan");
  });

  await knex.schema.alterTable("assets_orbit", (table) => {
    table.dropColumn("provinsi");
    table.dropColumn("kabupaten");
    table.dropColumn("detail_lokasi");
    table.dropColumn("keterangan");
  });
}
