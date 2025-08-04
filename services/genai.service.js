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

    const fullText = resultChunks.join('').trim();
    
    try {
      // 1. Check for JSON array
      const arrayStart = fullText.indexOf('[');
      const arrayEnd = fullText.lastIndexOf(']');
      if (arrayStart !== -1 && arrayEnd !== -1) {
        const arrayText = fullText.slice(arrayStart, arrayEnd + 1);
        return JSON.parse(arrayText);
      }
      
      // 2. Check for single JSON object
      const objectStart = fullText.indexOf('{');
      const objectEnd = fullText.lastIndexOf('}');
      if (objectStart !== -1 && objectEnd !== -1) {
        const objectText = fullText.slice(objectStart, objectEnd + 1);
        return JSON.parse(objectText);
      }

    // 3. Fallback: multiple objects, but not inside array
    const objectMatches = fullText.match(/{[^}]+}/g);
    if (objectMatches && objectMatches.length > 0) {
      const wrapped = `[${objectMatches.join(',')}]`;
      return JSON.parse(wrapped);
    }
  
    throw new Error("No valid JSON found in output.");
  } catch (err) {
    console.error("❌ JSON parsing failed:", err.message);
    throw err;
  }


  } catch (err) {
    console.error("❌ Error in callGemini:", err);
    throw err;
  }
}
