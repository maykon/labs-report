const util = require("util");
const glob = util.promisify(require("glob"));

var fs = require("fs");
const path = require("path");
const { sendMail } = require("./mailer");
const createCronJob = require("./cron");
const { executeQueryPg } = require("./postgres");
const { executeQueryOrcl } = require("./oracle");

const REGEX_IMG = /<img\s*src="([^"]+)"\s*data-filename="([^"]+)"\s*data-path="([^"]+)"\s*\/>/;

const sendMailReport = async (reportFile, params = {}) =>
  await sendMail({ html: reportFile, ...params }).catch(console.error);

const getSQLFiles = files =>
  files.filter(f => path.extname(f).toLowerCase() === ".sql");

const readFile = file => fs.readFileSync(file, "utf8");

const fileExists = file => {
  const exists = fs.existsSync(file);
  if (!exists) console.error(`File not exists: ${report.report}`);
  return exists;
};

const getParentDir = (stats, file) => {
  return stats.isDirectory()
    ? path.basename(file)
    : path.basename(path.dirname(file));
};

const executeQuery = async (baseName, sql) => {
  if (/_pg/.test(baseName)) {
    return await executeQueryPg(sql).catch(console.error);
  } else if (/_orcl/.test(baseName)) {
    return await executeQueryOrcl(sql).catch(console.error);
  }
  return {};
};

const getReportFiles = async reportDir => {
  const files = await glob(path.resolve(reportDir, "**"), {}).catch(
    console.error
  );
  return files.filter(f => path.resolve(f) !== path.resolve(reportDir));
};

const createJob = (schedule, process) => createCronJob(schedule, process);

const createCustomReport = reportName => ({
  name: reportName,
  files: [],
  job: null,
  schedule: "* * * * * *",
  report: null,
  recreate: false,
  mail: {}
});

const reduceAttachments = (acc, img) => {
  let groups = img.match(REGEX_IMG);
  const exists = fs.existsSync(groups[3]);
  if (exists) {
    acc["attachments"].push({
      cid: groups[1].replace("cid:", ""),
      filename: groups[2],
      path: groups[3]
    });
  }
  return acc;
};

const getAttachments = file => {
  if (!REGEX_IMG.test(file)) return null;
  let attached = file.match(new RegExp(REGEX_IMG, "g"));
  return attached.reduce(reduceAttachments, { attachments: [] });
};

module.exports = {
  fileExists,
  getParentDir,
  sendMailReport,
  createCustomReport,
  createJob,
  getReportFiles,
  getSQLFiles,
  readFile,
  executeQuery,
  getAttachments
};
