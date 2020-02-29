const { Pool } = require("pg");

let pool;

const createPoolPg = () => {
  if (pool) return;
  pool = new Pool();
};

const executeQueryPg = async (sql, params = []) => {
  createPoolPg();
  const res = await pool.query(sql, params).catch(console.error);
  return res.rows;
};

function closePoolPg() {
  if (pool) pool.end(() => {});
  pool = null;
}

module.exports = {
  createPoolPg,
  executeQueryPg,
  closePoolPg
};
