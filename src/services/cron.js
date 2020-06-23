const CronJob = require("cron").CronJob;

module.exports = (pattern, callback, onComplete = null) => {
  const job = new CronJob(
    pattern,
    callback,
    onComplete,
    true,
    "America/Sao_Paulo"
  );
  job.start();
  return job;
};
