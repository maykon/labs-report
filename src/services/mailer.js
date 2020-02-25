const nodemailer = require("nodemailer");

let transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secureConnection: process.env.SMTP_SECURE,
  tls: {
    ciphers: "SSLv3"
  },
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const message = {
  from: process.env.MAIL_FROM,
  to: process.env.MAIL_TO,
  subject: process.env.MAIL_SUBJECT
};

async function sendMail(msg) {
  return await transport.sendMail({ ...message, ...msg });
}

module.exports = {
  sendMail
};
