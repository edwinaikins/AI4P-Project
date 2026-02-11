import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Deep Agentic Idea Evaluation API",
      version: "1.0.0",
      description:
        "Agentic multi-agent evaluation engine for idea submissions with similarity detection and classification.",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    components: {
      schemas: {
        AgenticEvaluationRequest: {
          type: "object",
          required: ["new_idea"],
          properties: {
            new_idea: {
              type: "string",
              description:
                "Full idea text (structured JSON string or plain text)",
            },
            challengeConfig: {
              type: "object",
              properties: {
                challenge: { type: "string" },
                description: { type: "string" },
                goals: {
                  type: "array",
                  items: { type: "string" },
                },
                exclusions: {
                  type: "array",
                  items: { type: "string" },
                },
                focus_areas: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "conceptual_feasibility",
                      "technical_direction_clarity",
                      "complexity_awareness",
                      "scalability_potential",
                      "originality",
                      "depth_of_thinking",
                      "differentiation_logic",
                      "problem_definition_quality",
                      "problem_solution_alignment",
                      "potential_impact_directional",
                      "beneficiary_awareness",
                      "ethical_awareness",
                      "risk_awareness",
                      "regulatory_sensitivity",
                      "clarity_of_expression",
                      "logical_coherence",
                      "idea_stage_completeness",
                      "context_awareness",
                      "adoption_plausibility",
                      "challenge_alignment",
                      "classification"
                    ],
                  },
                },
              },
            },
            author_id: {
              type: "integer",
            },
            idea_id: {
              type: "integer",
            },
          },
        },

        AgenticEvaluationResponse: {
          type: "object",
          properties: {
            status: { type: "string" },
            evaluation: {
              type: "object",
              properties: {
                scores: { type: "object" },
                similarity: {
                  type: "object",
                  properties: {
                    similarity_score: { type: "number", nullable: true },
                    most_similar_idea: { type: "object", nullable: true },
                  },
                },
                classification: {
                  type: "object",
                  properties: {
                    idea_category: { type: "string", nullable: true },
                    idea_cluster: { type: "string", nullable: true },
                    cluster_id: { type: "integer", nullable: true },
                  },
                },
                infrastructure: {
                  type: "object",
                  properties: {
                    embedding: {
                      type: "array",
                      items: { type: "number" },
                    },
                  },
                },
              },
            },
            logs: {
              type: "array",
              items: { type: "object" },
            },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
