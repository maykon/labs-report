const CronJob = require("cron").CronJob;

module.exports = (patter, callback) => {
  const job = new CronJob(patter, callback, null, true, "America/Sao_Paulo");
  job.start();
  return job;
};
