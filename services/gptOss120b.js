import { asiClient, asiGenerationConfig } from "./asiClient.js";
import { parseJSONFromText } from "./jsonParser.js";

export async function callGptOss120b(systemPrompt, userInput) {
  if (typeof systemPrompt !== "string" || typeof userInput !== "string") {
    throw new Error("Both systemPrompt and userInput must be strings.");
  }

  try {
    const response = await asiClient.chat.completions.create({
      model: "openai/gpt-oss-120b",
      ...asiGenerationConfig,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput }
      ]
    });

    const fullText = response.choices[0]?.message?.content?.trim();

    if (!fullText) {
      throw new Error("Empty response from gpt-oss-120b.");
    }

    return parseJSONFromText(fullText);

  } catch (err) {
    console.error("❌ Error in callGptOss120b:", err);
    throw err;
  }
}