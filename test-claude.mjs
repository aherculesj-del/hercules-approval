import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function testModel(modelName) {
  try {
    console.log(`\n?? Testando: ${modelName}...`);
    const response = await client.messages.create({
      model: modelName,
      max_tokens: 50,
      messages: [{ role: "user", content: "Ola" }]
    });
    console.log(`? ${modelName} FUNCIONA!`);
    console.log(`Resposta: ${response.content[0].text}`);
  } catch (error) {
    console.log(`? ${modelName} falhou: ${error.message}`);
  }
}

async function test() {
  const modelsToTest = [
    "claude-opus",
    "claude-sonnet",
    "claude-haiku",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307"
  ];
  
  for (const model of modelsToTest) {
    await testModel(model);
  }
}

test();
