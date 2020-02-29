const oracledb = require("oracledb");
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;

const createPoolOrcl = async () => {
  if (pool) return;
  pool = await oracledb.createPool({
    user: process.env.ORCL_USER,
    password: process.env.ORCL_PASS,
    connectString: process.env.ORCL_URL
  });
};

async function executeQueryOrcl(sql, params = []) {
  let connection;
  try {
    await createPoolOrcl();
    connection = await pool.getConnection().catch(console.error);
    const result = await connection.execute(sql, params).catch(console.error);
    return result.rows;
  } finally {
    if (connection) {
      await connection.close().catch(console.error);
    }
  }
}

async function closePoolOrcl() {
  if (pool) await pool.close(0);
  pool = null;
}

module.exports = {
  createPoolOrcl,
  executeQueryOrcl,
  closePoolOrcl
};
