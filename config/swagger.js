import swaggerJsdoc from "swagger-jsdoc";
import { schemas } from "../docs/schema.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Deep Agentic Idea Evaluation API",
      version: "1.0.0",
      description: `Agentic multi-agent evaluation engine for idea submissions with similarity detection and classification.
        This API provides:
• Multi-agent idea evaluation
• AI-powered classification
• Embedding + clustering
• Cross-ecosystem similarity detection
• Stack ranking within challenges`,
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Development",
      },
      {
        url: "https://ai4p-apis-1051174858755.us-central1.run.app",
        description: "Production",
      },
    ],
    tags: [
      {
        name: "Evaluation",
        description: "Agentic multi-agent evaluation",
      },
      {
        name: "Similarity",
        description: "Idea similarity detection services",
      },
      {
        name: "Ranking",
        description: "Stack ranking and prioritization",
      },
    ],

    components: {
      schemas: {
        ...schemas,
      },

      responses: {
        ServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                  details: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
