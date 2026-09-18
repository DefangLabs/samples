const Pool = require("pg").Pool;

var parse = require('pg-connection-string').parse;

var config = parse(process.env.DATABASE_URL)

const pool = new Pool(config)



module.exports = pool;