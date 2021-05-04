const { Pool } = require("pg");

let pool;

const customPoolProps = {
  connectionString: process.env.PGCONNECT,
};

const createPoolPg = (config = {}) => {
  if (pool) return;
  pool = new Pool({ ...customPoolProps, ...config });
};

const executeQueryPg = async (sql, params = [], config) => {
  createPoolPg(config);
  try {
    const client = await pool.connect();
    const result = await client.query(sql, params);
    client.release();
    return result.rows;
  } catch (err) {
    console.log(err);
  }
};

function closePoolPg() {
  if (pool) pool.end(() => {});
  pool = null;
}

module.exports = {
  createPoolPg,
  executeQueryPg,
  closePoolPg,
};
