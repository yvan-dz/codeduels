const { Configuration, OpenAIApi } = require('openai');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('run_code', async ({ language, code }) => {
    const prompt = `Bitte analysiere und führe den folgenden ${language}-Code aus. Wenn es inkorrekt ist, sag bitte "Code Inkorrekt" + die Antwort und sag kurz warum es inkorrekt ist. Wenn es korrekt ist, sagt bitte "Code korrekt" und gibt eine Note auf 10 zu der Lösung:\n\n${code}`;
    try {
      const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: prompt,
        max_tokens: 150,
      });

      const result = response.data.choices[0].text.trim();
      socket.emit('code_result', { output: result });
    } catch (error) {
      socket.emit('code_result', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
