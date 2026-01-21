import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("trx_orbit").del();
    await knex("assets_orbit").del();
    await knex("trx_pln").del();
    await knex("assets_pln").del();

    // Inserts seed entries
    await knex("assets_pln").insert([
        { id: 1, nama_stasiun: "Pos Satpam Depan", meter_number: "12345678901", operator_wa: "628123456789" },
        { id: 2, nama_stasiun: "Server Room", meter_number: "22345678902", operator_wa: "628123456789" }
    ]);

    await knex("assets_orbit").insert([
        { id: 1, nama_stasiun: "Modem Lobby Utama", phone_number: "081299998888", operator_wa: "628123456789" },
        { id: 2, nama_stasiun: "Modem Gudang", phone_number: "081277776666", operator_wa: "628123456789" }
    ]);
};
