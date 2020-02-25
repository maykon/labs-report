const { Pool } = require("pg");

let pool;

const executeQueryPg = async (sql, params = []) => {
  pool = new Pool();
  const res = await pool.query(sql, params);
  closePool();
  return res.rows;
};

async function closePool() {
  if (pool) await pool.end();
}

module.exports = {
  executeQueryPg,
  closePool
};
