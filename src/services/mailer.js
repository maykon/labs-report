const nodemailer = require("nodemailer");

const configTransport = {
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
};

const message = {
  from: process.env.MAIL_FROM,
  to: process.env.MAIL_TO,
  subject: process.env.MAIL_SUBJECT
};

const createMailerTransport = config => {
  return nodemailer.createTransport(
    config ? { ...configTransport, ...config } : configTransport
  );
};

async function sendMail({ transport, ...params }) {
  const mailerTransport = createMailerTransport(transport);
  const newMessage = { ...message, ...params };
  return await mailerTransport.sendMail(newMessage);
}

module.exports = {
  sendMail
};
