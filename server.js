const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const JDoodleClientId = process.env.JDOODLE_CLIENT_ID;
const JDoodleClientSecret = process.env.JDOODLE_CLIENT_SECRET;

app.post('/api/execute', async (req, res) => {
    const { code } = req.body;

    try {
        const response = await fetch('https://api.jdoodle.com/v1/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                script: code,
                language: "java",
                versionIndex: "3",
                clientId: JDoodleClientId,
                clientSecret: JDoodleClientSecret
            })
        });

        const data = await response.json();
        if (data.output) {
            res.status(200).json({ output: data.output });
        } else {
            res.status(500).json({ output: 'No output generated' });
        }
    } catch (error) {
        res.status(500).json({ output: error.message });
    }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname)));

// Route for root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
