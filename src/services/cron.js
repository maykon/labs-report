const CronJob = require("cron").CronJob;

module.exports = (patter, callback, onComplete = null) => {
  const job = new CronJob(
    patter,
    callback,
    onComplete,
    true,
    "America/Sao_Paulo"
  );
  job.start();
  return job;
};
