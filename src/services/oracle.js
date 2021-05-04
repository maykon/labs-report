const oracledb = require("oracledb");
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;

const customPoolProps = {
  user: process.env.ORCL_USER,
  password: process.env.ORCL_PASS,
  connectString: process.env.ORCL_URL,
};

const createPoolOrcl = async (config = {}) => {
  if (pool) return;
  pool = await oracledb.createPool({ ...customPoolProps, ...config });
};

async function executeQueryOrcl(sql, params = [], config = {}) {
  let connection;
  try {
    await createPoolOrcl(config);
    connection = await pool.getConnection();
    const result = await connection.execute(sql, params);
    return result.rows;
  } finally {
    if (connection) {
      await connection.close();
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
  closePoolOrcl,
};
