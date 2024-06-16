const admin = require('firebase-admin');
const serviceAccount = require('codeduels-1b79f-firebase-adminsdk-5c4q4-077cc58a89.json'); // Pfad zur heruntergeladenen JSON-Datei

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
