require("dotenv").config();
const reportFiles = require("./services/reportFiles");
reportFiles();

process.on("uncaughtException", console.error);
