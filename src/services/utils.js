const util = require("util");
const glob = util.promisify(require("glob"));
const pdf = require("html-pdf");
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

const getSQLFiles = files =>
  files.filter(f => path.extname(f).toLowerCase() === ".sql");

const readFile = file => fs.readFileSync(file, "utf8");

const writeFile = (path, file) => {
  fs.writeFileSync(path, file);
};

const toPdf = async (html, out) => {
  let pdfPromise = new Promise((resolve, reject) => {
    let basePath = process.env.IMG_DIR;
    let options = {
      format: "A4",
      base: "file:///" + basePath.replace(/\\/g, "/") + "/",
      directory: process.env.OUTPUT_DIR
    };
    pdf.create(html, options).toStream(async (err, readStream) => {
      if (err) {
        console.error(err);
        return reject(err);
      }
      await pipeline(readStream, fs.createWriteStream(out)).catch(
        console.error
      );
      return resolve(true);
    });
  });

  return await pdfPromise.catch(console.error);
};

const fileExists = file => {
  const exists = fs.existsSync(file);
  if (!exists) console.error(`File not exists: ${file}`);
  return exists;
};

const getParentDir = (stats, file) => {
  return stats.isDirectory()
    ? path.basename(file)
    : path.basename(path.dirname(file));
};

const getOutputFileReport = file => {
  let filename = path.basename(path.dirname(file)).concat(".pdf");
  return [filename, path.resolve(process.env.OUTPUT_DIR, filename)];
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

const getReportFiles = async reportDir => {
  const files = await glob(path.resolve(reportDir, "**"), {}).catch(
    console.error
  );
  return files.filter(f => path.resolve(f) !== path.resolve(reportDir));
};

const createJob = (schedule, process, onComplete = null) =>
  createCronJob(schedule, process, onComplete);

const createCustomReport = reportName => ({
  name: reportName,
  files: [],
  job: null,
  schedule: "* * * * * *",
  report: null,
  recreate: false,
  mail: {},
  running: false
});

const reduceAttachments = (acc, img) => {
  let groups = img.match(REGEX_IMG);
  let basePath = process.env.IMG_DIR;
  let filename = groups[1];
  let filePath = path.resolve(basePath, filename);
  const exists = fs.existsSync(filePath);
  if (exists) {
    acc["attachments"].push({
      cid: `cid:${filename}`,
      filename,
      path: filePath
    });
  }
  return acc;
};

const addCIDInImages = file => {
  if (!REGEX_IMG.test(file)) return file;
  let images = file.match(new RegExp(REGEX_IMG, "g"));
  for (let img of images) {
    const matched = img.match(REGEX_IMG);
    const searchText = img;
    const replaceText = img.replace(matched[1], `cid:${matched[1]}`);
    file = file.replace(searchText, replaceText);
  }
  return file;
};

const getAttachments = file => {
  if (!REGEX_IMG.test(file)) return {};
  let attached = file.match(new RegExp(REGEX_IMG, "g"));
  return attached.reduce(reduceAttachments, defaultAttachment);
};

const getReportAttachments = (attach, pdf) => {
  if (!attach.attachments && !pdf.attachments) return {};
  if (attach.attachments && pdf.attachments) {
    let result = {};
    result.attachments = attach.attachments.concat(pdf.attachments);
    return result;
  }
  if (!attach.attachments) {
    return pdf;
  }
  return attach;
};

const isSameObject = (a, b) =>
  Object.entries(a)
    .sort()
    .toString() ===
  Object.entries(b)
    .sort()
    .toString();

module.exports = {
  fileExists,
  getParentDir,
  getOutputFileReport,
  sendMailReport,
  createCustomReport,
  createJob,
  getReportFiles,
  getSQLFiles,
  readFile,
  writeFile,
  toPdf,
  executeQuery,
  closePool,
  getAttachments,
  getReportAttachments,
  addCIDInImages,
  isSameObject
};
