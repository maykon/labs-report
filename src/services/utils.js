const util = require("util");
const glob = util.promisify(require("glob"));
const fs = require("fs");
const path = require("path");
const stream = require("stream");

const { sendMail } = require("./mailer");
const createCronJob = require("./cron");
const { executeQueryPg, closePoolPg } = require("./postgres");
const { executeQueryOrcl, closePoolOrcl } = require("./oracle");
const pipeline = util.promisify(stream.pipeline);

const REGEX_IMG = /<img\s*src="([^"]+)"\s*(?:alt="[^"]+")?\s*\/>/;
const GIT_KEEP = ".gitkeep";
const defaultAttachment = { attachments: [] };

const sendMailReport = async (reportFile, params = {}) =>
  await sendMail({ html: reportFile, ...params }).catch(console.error);

const getSQLFiles = (files) =>
  files.filter((f) => path.extname(f).toLowerCase() === ".sql");

const readFile = (file) => fs.readFileSync(file, "utf8");

const writeFile = (path, file) => {
  fs.writeFileSync(path, file);
};

const fileExists = (file) => {
  const exists = fs.existsSync(file);
  if (!exists) console.error(`File not exists: ${file}`);
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

const closePool = async () => {
  closePoolPg();
  await closePoolOrcl();
};

const getReportFiles = async (reportDir) => {
  const files = await glob(path.resolve(reportDir, "**"), {}).catch(
    console.error
  );
  return files.filter((f) => path.resolve(f) !== path.resolve(reportDir));
};

const createJob = (schedule, process, onComplete = null) =>
  createCronJob(schedule, process, onComplete);

const createCustomReport = (reportName) => ({
  name: reportName,
  files: [],
  job: null,
  schedule: "* * * * *",
  report: null,
  recreate: false,
  mail: {},
  running: false,
});

const reduceAttachments = (acc, img) => {
  const groups = img.match(REGEX_IMG);
  const basePath = process.env.IMG_DIR;
  const filename = groups[1];

  if (acc["attachments"].some((a) => a.filename === filename))
    return { ...acc };
  const cid = `cid:${filename}`;
  const filePath = path.resolve(basePath, filename);
  const exists = fs.existsSync(filePath);
  if (exists) {
    acc["attachments"] = [
      ...acc["attachments"],
      {
        cid,
        filename,
        path: filePath,
      },
    ];
  }
  return { ...acc };
};

const addCIDInImages = (file) => {
  if (!REGEX_IMG.test(file)) return file;
  const images = file.match(new RegExp(REGEX_IMG, "g"));
  for (let img of images) {
    const matched = img.match(REGEX_IMG);
    const searchText = img;
    const cid = `cid:${matched[1]}`;
    const replaceText = img.replace(matched[1], cid);
    file = file.replace(searchText, replaceText);
  }
  return file;
};

const getAttachments = (file) => {
  if (!REGEX_IMG.test(file)) return {};
  const attached = file.match(new RegExp(REGEX_IMG, "g"));
  return attached.reduce(reduceAttachments, {
    ...defaultAttachment,
  });
};

const isSameObject = (a, b) =>
  Object.entries(a).sort().toString() === Object.entries(b).sort().toString();

const closePoolInactives = (reports) => {
  let allInactive = reports.every((r) => !r.running);
  if (allInactive) {
    closePool();
  }
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

module.exports = {
  fileExists,
  getParentDir,
  sendMailReport,
  createCustomReport,
  createJob,
  getReportFiles,
  getSQLFiles,
  readFile,
  writeFile,
  executeQuery,
  closePool,
  getAttachments,
  addCIDInImages,
  isSameObject,
  closePoolInactives,
  addCustomPropsReport,
  addJsonParsedPropsReport,
};
