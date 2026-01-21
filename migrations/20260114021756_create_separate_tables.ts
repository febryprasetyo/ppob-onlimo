import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // --- A. Schema PLN (Listrik) ---
  
  // 1. assets_pln
  await knex.schema.createTable("assets_pln", (table) => {
    table.increments("id").primary();
    table.string("nama_stasiun").notNullable().comment("Nama Lokasi (e.g. Pos Satpam)");
    table.string("meter_number").notNullable().comment("ID Pelanggan PLN");
    table.string("operator_wa").nullable().comment("No WA Penanggung Jawab");
    table.timestamps(true, true);
  });

  // 2. trx_pln
  await knex.schema.createTable("trx_pln", (table) => {
    table.string("ref_id").primary().unique().comment("Format: PLN-Timestamp");
    table.integer("asset_id").unsigned().notNullable().references("id").inTable("assets_pln").onDelete("CASCADE");
    table.string("sku").notNullable();
    table.decimal("price", 14, 2).notNullable();
    table.enum("status", ["PENDING", "SUCCESS", "FAILED"]).defaultTo("PENDING");
    table.string("token_sn").nullable().comment("20 digit token. NOT NULLABLE when SUCCESS");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // --- B. Schema Orbit (Internet/Pulsa) ---

  // 1. assets_orbit
  await knex.schema.createTable("assets_orbit", (table) => {
    table.increments("id").primary();
    table.string("nama_stasiun").notNullable().comment("Nama Pengguna (e.g. Modem Lobby)");
    table.string("phone_number").notNullable().comment("Nomor Kartu Orbit");
    table.string("operator_wa").nullable().comment("No WA Penanggung Jawab");
    table.timestamps(true, true);
  });

  // 2. trx_orbit
  await knex.schema.createTable("trx_orbit", (table) => {
    table.string("ref_id").primary().unique().comment("Format: ORB-Timestamp");
    table.integer("asset_id").unsigned().notNullable().references("id").inTable("assets_orbit").onDelete("CASCADE");
    table.string("sku").notNullable();
    table.decimal("price", 14, 2).notNullable();
    table.enum("status", ["PENDING", "SUCCESS", "FAILED"]).defaultTo("PENDING");
    table.string("sn_ref").nullable().comment("Provider SN/Ref ID (Hidden in UI)");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("trx_orbit");
  await knex.schema.dropTableIfExists("assets_orbit");
  await knex.schema.dropTableIfExists("trx_pln");
  await knex.schema.dropTableIfExists("assets_pln");
}
