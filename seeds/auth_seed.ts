import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    // Inserts seed entries
    await knex("users").insert([
        { id: 1, username: "admin", password: "1234", role: "admin" }
    ]).onConflict("username").ignore();
};
