const express = require('express');
const bodyParser = require('body-parser');
const OpenAI = require('openai');

const app = express();
const port = 5000;

app.use(bodyParser.json());

// Setze deinen OpenAI-API-Schlüssel
const openai = new OpenAI({
  apiKey: 'sk-proj-m4QSl1lYtz6t3330lVH6T3BlbkFJkvLm1yqINLJoWEb97ZoD',
});

app.post('/run_code', async (req, res) => {
  const { language, code } = req.body;

  const prompt = `Bitte analysiere und führe den folgenden ${language}-Code aus. Wenn es inkorrekt ist, sag bitte "Code Inkorrekt"+die Antwort und sag kurz warum es inkorrekt ist. Wenn es korrekt ist, sagt bitte "Code korrekt: und gibt eine Note auf 10 zu der Lösung. :\n\n${code}`;
  try {
    const response = await openai.completions.create({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 150,
    });

    const result = response.choices[0].text.trim();
    res.json({ output: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
