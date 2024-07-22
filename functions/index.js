const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
admin.initializeApp();

const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

exports.sendContactMessage =
functions.firestore.document("messages/{docId}").onCreate((snap, context) => {
  const mailOptions = {
    from: snap.data().email,
    replyTo: snap.data().email,
    to: "yvandzefak1@gmail.com",
    subject: `Contact Form Message from ${snap.data().name}`,
    text: snap.data().message,
    html: `<p>${snap.data().message}</p>`,
  };

  return mailTransport.sendMail(mailOptions).then(() => {
    console.log("New email sent to:", gmailEmail);
  }).catch((error) => {
    console.error("There was an error while sending the email:", error);
  });
});
