const oracledb = require("oracledb");
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;
async function executeQueryOrcl(sql, params = []) {
  try {
    pool = await oracledb.createPool({
      user: process.env.ORCL_USER,
      password: process.env.ORCL_PASS,
      connectString: process.env.ORCL_URL
    });

    let connection;
    try {
      connection = await pool.getConnection();

      const result = await connection.execute(sql, params);
      return result.rows;
    } catch (err) {
      console.error(err);
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error(err);
        }
      }
    }
  } catch (err) {
    console.error(err.message);
  } finally {
    await closePool();
  }
}

async function closePool() {
  if (pool) await pool.close(0);
}

module.exports = {
  executeQueryOrcl,
  closePool
};
