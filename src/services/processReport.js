const path = require("path");
const {
  fileExists,
  readFile,
  getSQLFiles,
  executeQuery,
  sendMailReport,
  getAttachments,
  addCIDInImages
} = require("./utils");
const { prepareReportFile, prepareHtmlFile } = require("./prepareReport");

const SQL_EXT = ".sql";

const executeQuerysReport = async report => {
  console.log(`\tExecuting querys from job name -> ${report.name}`);
  let querys = {};
  const sqlFiles = getSQLFiles(report.files);
  try {
    for await (let file of sqlFiles) {
      try {
        const baseName = path.basename(file, SQL_EXT);
        const fileContent = readFile(file);
        querys[baseName] = await executeQuery(baseName, fileContent);
      } catch (err) {
        console.error(err);
      }
    }
  } finally {
    return querys;
  }
};

module.exports = async (reports, report, index) => {
  console.log(`\n\tExecuting job name -> ${report.name}`);
  reports[index].running = true;
  try {
    if (!fileExists(report.report)) return;

    let reportFile = readFile(report.report);
    let querys = await executeQuerysReport(report);

    console.log(`\tPreparing data from job name -> ${report.name}`);
    reportFile = prepareReportFile(querys, reportFile);
    const reportAttachments = getAttachments(reportFile);
    reportFile = prepareHtmlFile(reportFile);
    reportFile = addCIDInImages(reportFile);
    const mailParams = { ...reportAttachments, ...report.mail };

    console.log(`\tSending email job name -> ${report.name}`);
    let info = await sendMailReport(reportFile, mailParams);
    if (info.rejected.length > 0)
      throw new Error(`Envio do relatório "${report.name}" foi rejeitado.`);
  } finally {
    reports[index].running = false;
    console.log(`\tFinished job name -> ${report.name}\n`);
  }
};
