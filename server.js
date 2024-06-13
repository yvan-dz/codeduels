const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

const corsOptions = {
    origin: '*', // Erlaubt alle Ursprünge, du kannst dies anpassen, um spezifische Ursprünge zu erlauben
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Access-Control-Allow-Private-Network'], // Exponiere den Private-Network-Header
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

app.post('/proxy', async (req, res) => {
    const { url, ...options } = req.body;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: options.headers,
            body: options.body
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
        }
        const data = await response.json();
        res.set('Access-Control-Allow-Private-Network', 'true'); // Setze den Header hier
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
