import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 8080,
  PROJECT_ID: process.env.GCP_PROJECT_ID,
  LOCATION: 'global',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash-001',
  ASI_API_KEY: process.env.ASI_API_KEY || 'sk-MQax396T02NP7kp7coCZ4RptEq1K9k0BonQNf3_IXk8',
};
