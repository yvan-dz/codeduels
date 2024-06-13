const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/execute', async (req, res) => {
    const { language, code } = req.body;

    const payload = {
        script: code,
        language: language,
        versionIndex: "4",  // Set appropriate version for the language
        clientId: "YOUR_JDOODLE_CLIENT_ID",
        clientSecret: "YOUR_JDOODLE_CLIENT_SECRET"
    };

    try {
        const response = await fetch('https://api.jdoodle.com/v1/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.error) {
            res.status(400).send({ error: result.error });
        } else {
            res.send({ output: result.output });
        }
    } catch (error) {
        res.status(500).send({ error: error.toString() });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
