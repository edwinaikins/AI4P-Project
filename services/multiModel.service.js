import { callGemini } from "./genai.service.js";
import { callAsiMini } from "./asiMini.js";
import { callGptOss120b } from "./gptOss120b.js";
import { callLlama70b } from "./llama70b.js";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function safeCall(name, fn) {
  try {
    const result = await fn();
    return { model: name, ...result };
  } catch (error) {
    if (String(error.message).includes("429")) {
      await sleep(1000);
      try {
        const retry = await fn();
        return { model: name, ...retry };
      } catch (retryError) {
        return { model: name, error: retryError.message };
      }
    }
    return { model: name, error: error.message };
  }
}

export async function scoreWithAllModels(prompt, input) {
  const models = [
    ["gemini", () => callGemini(prompt, input)],
    ["asi1-mini", () => callAsiMini(prompt, input)],
    ["gpt-oss-120b", () => callGptOss120b(prompt, input)],
    ["llama-3.3-70b", () => callLlama70b(prompt, input)],
  ];

  const results = await Promise.all(
    models.map(([name, fn]) => safeCall(name, fn))
  );

  return results;
}