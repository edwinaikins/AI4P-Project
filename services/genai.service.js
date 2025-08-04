import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';

const ai = new GoogleGenAI({
  vertexai: true,
  project: config.PROJECT_ID,
  location: config.LOCATION,
});

const generationConfig = {
  temperature: 0.2,
  maxOutputTokens: 8192, //65535,
  topP: 1,
  seed: 0,
  safetySettings: [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' }
  ]
};


export async function callGemini(systemPrompt, userInput) {
  if (typeof systemPrompt !== 'string' || typeof userInput !== 'string') {
    throw new Error("Both systemPrompt and userInput must be strings.");
  }

  const chat = ai.chats.create({
    model: config.MODEL,
    config: generationConfig,
  });

  let resultChunks = [];

  try {
    const response = await chat.sendMessageStream({ message: [systemPrompt, userInput] });

    for await (const chunk of response) {
      if (chunk.text) {
        resultChunks.push(chunk.text);
      }
    }

    const fullText = resultChunks.join('');
    //console.log("🧾 Full response:", fullText);

    // const jsonStart = fullText.indexOf('{');
    // const jsonEnd = fullText.lastIndexOf('}');
    // if (jsonStart === -1 || jsonEnd === -1) throw new Error('Invalid JSON returned');

    // const json = JSON.parse(fullText.slice(jsonStart, jsonEnd + 1));
    // return json;

    const start = fullText.indexOf('{') !== -1 ? fullText.indexOf('{') : fullText.indexOf('[');
    const end = fullText.lastIndexOf('}') !== -1 ? fullText.lastIndexOf('}') : fullText.lastIndexOf(']');
    
    if (start === -1 || end === -1) {
      throw new Error('No valid JSON object or array found in the response.');
    }
    
    const rawJson = fullText.slice(start, end + 1).trim();
    let parsed;
    
    try {
      parsed = JSON.parse(rawJson);
    } catch (parseErr) {
      console.error("❌ Failed to parse JSON:", rawJson);
      throw parseErr;
    }

    return parsed;

  } catch (err) {
    console.error("❌ Error in callGemini:", err);
    throw err;
  }
}
