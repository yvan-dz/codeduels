const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const JDoodleClientId = process.env.JDOODLE_CLIENT_ID;
const JDoodleClientSecret = process.env.JDOODLE_CLIENT_SECRET;

const languageMap = {
    java: { language: 'java', versionIndex: '3' },
    python: { language: 'python3', versionIndex: '3' },
    javascript: { language: 'nodejs', versionIndex: '3' },
    cpp: { language: 'cpp', versionIndex: '5' },
    csharp: { language: 'csharp', versionIndex: '3' },
    c: { language: 'c', versionIndex: '4' } // Hinzufügen der Unterstützung für C
};

app.post('/api/execute', async (req, res) => {
    const { code, language } = req.body;

    if (!languageMap[language]) {
        return res.status(400).json({ error: 'Unsupported language' });
    }

    const { language: lang, versionIndex } = languageMap[language];

    try {
        console.log(`Executing code in language: ${lang}`);
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
        console.log('JDoodle API response:', data);

        if (data.output) {
            res.status(200).json({ output: data.output });
        } else {
            const errorMessage = data.error ? data.error : 'No output generated';
            res.status(500).json({ output: errorMessage, error: data });
        }
    } catch (error) {
        console.error('Error executing code:', error);
        res.status(500).json({ output: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
