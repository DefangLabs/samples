const Pool = require("pg").Pool;

const pool = new Pool({
    user: "myuser",
    password: "mypassword",
    database: "mydatabase",
    host: process.env.DB_HOST,
    port: 5432
})



module.exports = pool;