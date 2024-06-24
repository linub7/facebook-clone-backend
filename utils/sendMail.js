const nodemailer = require('nodemailer');

// async..await is not allowed in global scope, must use a wrapper
const sendEmail = async ({ email, subject, message }) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const emailData = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: subject,
    html: message,
  };

  const result = await transporter.sendMail(emailData);
  console.log(result);
};

module.exports = sendEmail;

// const nodemailer = require('nodemailer');

// // async..await is not allowed in global scope, must use a wrapper
// const sendEmail = async (options) => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: process.env.SMTP_PORT,
//     auth: {
//       user: process.env.SMTP_EMAIL, // generated ethereal user
//       pass: process.env.SMTP_PASSWORD, // generated ethereal password
//     },
//   });

//   // send mail with defined transport object
//   const message = {
//     from: `${process.env.FROM_NAME}<${process.env.FROM_EMAIL}>`, // sender address
//     to: options.email, // list of receivers
//     subject: options.subject, // Subject line
//     html: options.message, // plain text body
//   };

//   const info = await transporter.sendMail(message);
//   console.log({ info });

//   console.log('Message sent: %s', info.messageId);
// };

// module.exports = sendEmail;
