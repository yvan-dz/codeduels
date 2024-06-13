const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/proxy', async (req, res) => {
    const { url, ...options } = req.body;
    try {
        const response = await fetch(url, options);
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
