const path = require("path");
const {
  fileExists,
  readFile,
  getSQLFiles,
  executeQuery,
  sendMailReport,
  getAttachments
} = require("./utils");
const { prepareReport } = require("./prepareReport");

const SQL_EXT = ".sql";

module.exports = async report => {
  console.log(`\n\tExecuting job name -> ${report.name}`);
  if (!fileExists(report.report)) return;

  let querys = {};
  let reportFile = readFile(report.report);
  const sqlFiles = getSQLFiles(report.files);
  console.log(`\tExecuting querys from job name -> ${report.name}`);
  for await (let file of sqlFiles) {
    try {
      const baseName = path.basename(file, SQL_EXT);
      const fileContent = readFile(file);
      querys[baseName] = await executeQuery(baseName, fileContent);
    } catch (err) {
      console.error(err);
    }
  }

  console.log(`\tPreparing data from job name -> ${report.name}`);
  const reportValues = prepareReport(querys);
  for (let [key, text] of Object.entries(reportValues)) {
    reportFile = reportFile.replace(new RegExp(key, "g"), text);
  }

  const attachments = getAttachments(reportFile);

  console.log(`\tSending email job name -> ${report.name}`);
  let info = await sendMailReport(reportFile, attachments);
  if (info.rejected.length > 0)
    throw new Error(`Envio do relatório "${report.name}" foi rejeitado.`);

  console.log(`\tFinished job name -> ${report.name}\n`);
};
