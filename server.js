// Importieren der notwendigen Module
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const cors = require('cors');

// Erstellen einer Express-Anwendung
const app = express();

// Middleware für die Verarbeitung von JSON-Anfragen und für CORS
app.use(bodyParser.json());
app.use(cors());

// Bereitstellen statischer Dateien aus dem Wurzelverzeichnis
app.use(express.static(path.join(__dirname)));

// Route für die Wurzel-URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// JDoodle API Client ID und Secret aus Umgebungsvariablen
const JDoodleClientId = process.env.JDOODLE_CLIENT_ID;
const JDoodleClientSecret = process.env.JDOODLE_CLIENT_SECRET;

// Konfiguration für Java (nur Java wird unterstützt)
const languageMap = {
    java: { language: 'java', versionIndex: '3' }
};

// Route für die Code-Ausführung
app.post('/api/execute', async (req, res) => {
    const { code, language } = req.body;

    // Überprüfen, ob die angeforderte Sprache unterstützt wird
    if (!languageMap[language]) {
        return res.status(400).json({ error: 'Unsupported language' });
    }

    const { language: lang, versionIndex } = languageMap[language];

    try {
        // Senden einer Anfrage an die JDoodle API
        const response = await fetch('https://api.jdoodle.com/v1/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                script: code,
                language: lang,
                versionIndex: versionIndex,
                clientId: JDoodleClientId,
                clientSecret: JDoodleClientSecret
            })
        });

        const data = await response.json();

        // Überprüfen, ob eine Ausgabe zurückgegeben wurde
        if (data.output) {
            res.status(200).json({ output: data.output });
        } else {
            res.status(500).json({ output: 'No output generated' });
        }
    } catch (error) {
        // Fehlerbehandlung
        res.status(500).json({ output: error.message });
    }
});

// Starten des Servers
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
