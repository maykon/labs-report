const path = require("path");
const fs = require("fs");
const processReport = require("./processReport");
const {
  getReportFiles,
  getParentDir,
  createCustomReport,
  createJob,
  readFile,
  isSameObject,
  closePool
} = require("./utils");

let reports = [];
const CRON_FILE = "cron";
const REPORT_FILE = "report.html";
const MAIL_FILE = "mail.json";

const createProcessReport = () => {
  reports = reports.map((r, i) => {
    r.schedule = r.schedule || "* * * * * *";

    if (!r.recreate) {
      console.log(
        `Not changed job -> ${r.name} -> ${r.running ? "Running" : "iddle"} (${
          r.schedule
        })`
      );
      return r;
    }

    r.recreate = false;
    if (r.job) {
      console.log(`Stoping old job -> ${r.name}`);
      r.job.stop();
    }

    console.log(`Creating new job -> ${r.name} (${r.schedule})`);
    r.job = createJob(r.schedule, () => processReport(reports, r, i));
    return r;
  });
};

const addCustomPropsReport = (job, prop, file, read = true) => {
  let oldValue = job[prop];
  job[prop] = read ? readFile(file) : file;
  if (oldValue !== job[prop]) job.recreate = prop;
  return job;
};

const addJsonParsedPropsReport = (job, prop, file) => {
  let oldValue = job[prop];
  job[prop] = JSON.parse(readFile(file));
  if (!isSameObject(oldValue, job[prop])) job.recreate = prop;
  return job;
};

const updateJob = (job, stats, parentDir, file) => {
  const basename = path.basename(file);
  if (getParentDir(stats, file) !== job.name) return;

  if (stats.isFile()) {
    switch (basename) {
      case MAIL_FILE:
        job = addJsonParsedPropsReport(job, "mail", file);
        break;
      case CRON_FILE:
        job = addCustomPropsReport(job, "schedule", file);
        break;
      case REPORT_FILE:
        job = addCustomPropsReport(job, "report", file, false);
        break;
      default:
        if (!job.files.some(f => f === file)) {
          job.recreate = file;
          job.files = [...job.files, file];
        }
    }
    reports = reports.map(r => (r.name === parentDir ? job : r));
  }
};

const addReportProcess = file => {
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

const closePoolInactives = () => {
  let allInactive = reports.every(r => !r.running);
  if (allInactive) {
    closePool();
  }
};

const processFiles = async () => {
  const reportDir = process.env.REPORT_DIR.toLowerCase();

  console.log(`Reading report files...`);
  const reportFiles = await getReportFiles(reportDir);
  for (let file of reportFiles) {
    addReportProcess(file);
  }
  createProcessReport();
  closePoolInactives();
};

module.exports = () => {
  return createJob(process.env.CRON_PROCESS, processFiles);
};
