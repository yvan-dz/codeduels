const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: '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', // Ersetze dies durch deinen tatsächlichen API-Key
});
const openai = new OpenAIApi(configuration);

async function testOpenAI() {
  try {
    const response = await openai.createCompletion({
      model: 'gpt-3.5-turbo', // Verwende das verfügbare Modell
      prompt: 'Hello, world!',
      max_tokens: 5,
    });
    console.log(response.data.choices[0].text);
  } catch (error) {
    console.error('OpenAI API Test Error:', error.response ? error.response.data : error.message);
  }
}

testOpenAI();
