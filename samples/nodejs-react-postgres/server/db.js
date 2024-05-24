const Pool = require("pg").Pool;

var parse = require('pg-connection-string').parse;

var config = parse(process.env.DATABASE_URL)

const pool = new Pool({
    user: config.user,
    password: config.password,
    database: config.database,
    host: config.host,
    port: config.port,
    ssl: {
        rejectUnauthorized: false
    }
})



module.exports = pool;