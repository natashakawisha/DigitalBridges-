// ===== Email Transporter =====
// Builds the nodemailer transporter used for contact-form notifications.
// Moved from server.js. Credentials are passed in by the caller so this
// module itself holds no secrets; switching them to environment values is
// handled in a later module.
const nodemailer = require('nodemailer');

function createMailer(user, pass) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
}

module.exports = createMailer;
