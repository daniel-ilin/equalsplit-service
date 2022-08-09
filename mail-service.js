var nodemailer = require("nodemailer");
var senderMail = "equalsplitapp@gmail.com";

async function sendMail(receiverMail, subject, message, completion) {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: senderMail, pass: process.env.MAIL_PWD },
  });

  var mailOptions = {
    from: senderMail,
    to: receiverMail,
    subject: subject,
    text: message,
  };

  transporter.sendMail(mailOptions, async function (error, info) {
    if (error) {      
      return
    } else {
      console.log("Email sent: " + info.response);
      completion();
    }
  });
}

module.exports = { sendMail };
