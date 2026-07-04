import dotenv from "dotenv";
dotenv.config();

import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.API_KEY;
const model = process.env.MODEL;

if (!apiKey) {
  throw new Error("API_KEY is not set");
}

if (!model) {
  throw new Error("MODEL is not set");
}

const client = new Anthropic({
  apiKey,
  baseURL: "https://openrouter.ai/api",
});

const message = await client.messages.create({
  model,
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: "Hello, Claude",
    },
  ],
});

for (const block of message.content) {
  if (block.type === "text") {
    console.log(block.text);
  }
}