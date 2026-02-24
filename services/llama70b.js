import { asiClient, asiGenerationConfig } from "./asiClient.js";
import { parseJSONFromText } from "./jsonParser.js";

export async function callLlama70b(systemPrompt, userInput) {
  if (typeof systemPrompt !== "string" || typeof userInput !== "string") {
    throw new Error("Both systemPrompt and userInput must be strings.");
  }

  try {
    const response = await asiClient.chat.completions.create({
      model: "meta-llama/llama-3.3-70b-instruct",
      ...asiGenerationConfig,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput }
      ]
    });

    const fullText = response.choices[0]?.message?.content?.trim();

    if (!fullText) {
      throw new Error("Empty response from llama-3.3-70b-instruct.");
    }

    return parseJSONFromText(fullText);

  } catch (err) {
    console.error("❌ Error in callLlama70b:", err);
    throw err;
  }
}