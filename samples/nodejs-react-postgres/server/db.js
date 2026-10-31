const Pool = require("pg").Pool;

var parse = require('pg-connection-string').parse;

// DATABASE_URL (local dev) or, when deployed, POSTGRES_HOST and POSTGRES_PASSWORD
var config = process.env.DATABASE_URL
  ? parse(process.env.DATABASE_URL)
  : {
      host: process.env.POSTGRES_HOST || "localhost",
      port: 5432,
      user: "postgres",
      password: process.env.POSTGRES_PASSWORD,
      database: "postgres",
      // Defang managed Postgres requires SSL; set POSTGRES_SSL=false for a plain Postgres
      ssl: process.env.POSTGRES_SSL === "false" ? false : { rejectUnauthorized: false },
    }

const pool = new Pool(config)

module.exports = pool;
