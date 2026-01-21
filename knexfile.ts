import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT) || 5433,
      database: process.env.DB_NAME || "ppob_db",
      user: process.env.DB_USER || "dbonlimo",
      password: process.env.DB_PASSWORD || "oms001",
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations",
      extension: "ts"
    }
  }
};

export default config;
