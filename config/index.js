import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 8080,
  PROJECT_ID: process.env.GCP_PROJECT_ID,
  LOCATION: 'global',
  MODEL: 'gemini-1.5-flash', //'gemini-2.5-pro-preview-06-05',
};
