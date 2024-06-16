const { Configuration, OpenAIApi } = require('openai');
const express = require('express');
const app = express();

app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/api/run_code', async (req, res) => {
  const { language, code } = req.body;

  const prompt = `Bitte analysiere und führe den folgenden ${language}-Code aus. Wenn es inkorrekt ist, sag bitte "Code Inkorrekt" + die Antwort und sag kurz warum es inkorrekt ist. Wenn es korrekt ist, sagt bitte "Code korrekt" und gibt eine Note auf 10 zu der Lösung:\n\n${code}`;
  try {
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 150,
    });

    const result = response.data.choices[0].text.trim();
    res.json({ output: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
