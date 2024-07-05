const express = require('express');
const path = require('path');
const app = express();

// Middleware, um JSON-Anfragen zu verarbeiten
app.use(express.json());

// Statische Dateien aus dem 'public' Verzeichnis bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// Standardroute, um die index.html zurückzugeben
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Starten des Servers
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
