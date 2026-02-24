import { OpenAI } from "openai";
import { config } from "../config/index.js";

export const asiClient = new OpenAI({
  apiKey: config.ASI_API_KEY,
  baseURL: "https://inference.asicloud.cudos.org/v1"
});

export const asiGenerationConfig = {
  temperature: 0.2,
  max_tokens: 8192,
  top_p: 1,
  seed: 0
};