const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function test() {
  try {
    const response = await client.messages.create({
      model: "claude-3-sonnet-20250219",
      max_tokens: 100,
      messages: [{ role: "user", content: "Say hello" }],
    });
    console.log("? FUNCIONOU!");
    console.log("Modelo:", "claude-3-sonnet-20250219");
  } catch (error) {
    console.error("? Modelo não existe:", error.message);
    console.log("\nTenta verificar em: https://docs.anthropic.com/en/docs/about/models");
  }
}

test();
