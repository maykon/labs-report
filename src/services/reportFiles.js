const path = require("path");
var fs = require("fs");
const processReport = require("./processReport");
const {
  getReportFiles,
  getParentDir,
  createCustomReport,
  createJob,
  readFile
} = require("./utils");

let reports = [];
const CRON_FILE = "cron";
const REPORT_FILE = "report.html";
const MAIL_FILE = "mail.json";

const createProcessReport = () => {
  reports = reports.map(r => {
    r.schedule = r.schedule || "* * * * * *";

    if (!r.recreate) {
      console.log(`Not changed job -> ${r.name} (${r.schedule})`);
      return r;
    }

    r.recreate = false;
    if (r.job) {
      console.log(`Stoping old job -> ${r.name}`);
      r.job.stop();
    }

    console.log(`Creating new job -> ${r.name} (${r.schedule})`);
    r.job = createJob(r.schedule, () => processReport(r));
    return r;
  });
};

const addCustomPropsReport = (job, prop, file, read = true) => {
  let oldValue = job[prop];
  job[prop] = read ? readFile(file) : file;
  if (oldValue !== job[prop]) job.recreate = true;
  return job;
};

const updateJob = (job, stats, parentDir, file) => {
  const basename = path.basename(file);
  if (getParentDir(stats, file) !== job.name) return;

  if (stats.isFile()) {
    switch (basename) {
      case MAIL_FILE:
        job = addCustomPropsReport(job, "mail", file);
        break;
      case CRON_FILE:
        job = addCustomPropsReport(job, "schedule", file);
        break;
      case REPORT_FILE:
        job = addCustomPropsReport(job, "report", file, false);
        break;
      default:
        if (!job.files.some(f => f === file)) {
          job.recreate = true;
          job.files = [...job.files, file];
        }
    }
    reports = reports.map(r => (r.name === parentDir ? job : r));
  }
};

const addReportProcess = async file => {
  const stats = fs.statSync(file);
  const parentDir = getParentDir(stats, file);
  const job = reports.find(j => j.name === parentDir);
  if (job) {
    updateJob(job, stats, parentDir, file);
  } else {
    console.log("Adding report file ->", parentDir);
    reports.push(createCustomReport(parentDir));
  }
};

const processFiles = async () => {
  const reportDir = path.resolve(__dirname, "..", "reports").toLowerCase();

  console.log(`Reading report files...`);
  const reportFiles = await getReportFiles(reportDir);
  for (let file of reportFiles) {
    addReportProcess(file);
  }
  createProcessReport();
};

module.exports = () => {
  return createJob("*/30 * * * * *", processFiles);
};
