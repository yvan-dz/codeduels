const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Access-Control-Allow-Private-Network'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

app.post('/proxy', async (req, res) => {
    const { url, options } = req.body;
    console.log('Proxying request to:', url);
    console.log('With options:', options);

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
        }
        const data = await response.json();
        res.set('Access-Control-Allow-Private-Network', 'true');
        res.json(data);
    } catch (error) {
        console.error('Error during proxy request:', error);
        res.status(500).json({ error: error.toString() });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
