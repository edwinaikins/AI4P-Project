import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 8080,
  PROJECT_ID: process.env.GCP_PROJECT_ID,
  LOCATION: 'global',
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  ASI_API_KEY: process.env.ASI_API_KEY,
};
