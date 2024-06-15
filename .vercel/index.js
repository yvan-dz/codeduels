const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch');
const admin = require('./firebaseAdmin'); // Stelle sicher, dass du den richtigen Pfad zur Datei verwendest

const app = express();
app.use(cors()); // Erlaubt alle Ursprünge
app.use(bodyParser.json());

app.post('/api/execute', async (req, res) => {
    const { language, code, idToken } = req.body;

    try {
        // Überprüfe das ID-Token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const payload = {
            script: code,
            language: language,
            versionIndex: "4",  // Setze die passende Version für die Sprache
            clientId: "3706ea5453e54a739123564dd68b94eb",
            clientSecret: "450644a69c2babf10bdb3e93419935e34d39eb78f7b013e7ad3bafa77e05b8c7"
        };

        console.log('Payload:', payload);

        const response = await fetch('https://api.jdoodle.com/v1/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        console.log('Result:', result);
        if (result.error) {
            res.status(400).send({ error: result.error });
        } else {
            res.send({ output: result.output });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: error.toString() });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
