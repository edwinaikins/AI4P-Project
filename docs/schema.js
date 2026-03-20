export const schemas = {
  // ==========================================
  // GENERIC IDEA INPUT
  // ==========================================
  IdeaTextInput: {
    type: "object",
    required: ["new_idea"],
    properties: {
      new_idea: {
        type: "string",
        description: "Full idea text (plain or structured JSON string)",
      },
    },
  },

  // ==========================================
  // AGENTIC IDEA SUBMISSION INPUT
  // ==========================================

  AgenticEvaluationRequest: {
    type: "object",
    required: ["new_idea"],
    properties: {
      new_idea: {
        type: "string",
        description: "Full idea text (structured JSON string or plain text)",
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
            description:
              "Focus areas used for evaluation. Each focus area includes its identifier and weight contribution to the final score. Weights must sum to 1.",
            items: {
              type: "object",
              description:
                "Focus areas used for evaluation. Each focus area includes its identifier and weight contribution to the final score. Weights must sum to 1.",
              required: ["id", "weight"],
              properties: {
                id: {
                  type: "string",
                  example: "conceptual_feasibility",
                },
                weight: {
                  type: "number",
                  format: "float",
                  example: 0.1,
                  description:
                    "Weight assigned to this focus area. All weights must sum to 1.",
                },
              },
              enum: [
                {id: "conceptual_feasibility", weight: 0.05},
                {id: "technical_direction_clarity", weight: 0.05},
                {id: "complexity_awareness", weight: 0.05},
                {id: "scalability_potential", weight: 0.05},
                {id: "originality", weight: 0.05},
                {id: "depth_of_thinking", weight: 0.05},
                {id: "differentiation_logic", weight: 0.05},
                {id: "problem_definition_quality", weight: 0.05},
                {id: "problem_solution_alignment", weight: 0.05},
                {id: "potential_impact_directional", weight: 0.05},
                {id: "beneficiary_awareness", weight: 0.05},
                {id: "ethical_awareness", weight: 0.05},
                {id: "risk_awareness", weight: 0.05},
                {id: "regulatory_sensitivity", weight: 0.05},
                {id: "clarity_of_expression", weight: 0.05},
                {id: "logical_coherence", weight: 0.05},
                {id: "idea_stage_completeness", weight: 0.05},
                {id: "context_awareness", weight: 0.05},
                {id: "adoption_plausibility",  weight: 0.05},
                {id: "challenge_alignment", weight: 0.05}
              ],
            },
          },
        },
      },
    },
  },

  // ==========================================
  // AGENTIC IDEA SUBMISSION RESPONSE
  // ==========================================

  AgenticEvaluationResponse: {
    type: "object",
    properties: {
      status: { type: "string" },
      evaluation: {
        type: "object",
        properties: {
          //scores: { type: "object" },
          // ----------------------------------
          // Multi-LLM Scores (Dynamic Keys)
          // ----------------------------------
          scores: {
            type: "object",
            additionalProperties: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  model: { type: "string" },
                  score: { type: "number", nullable: true },
                  confidence: { type: "number", nullable: true },
                  reasoning: { type: "string", nullable: true },
                },
              },
            },
          },
          rating_summary: {
            type: "object",
            properties: {
              focus_area_breakdown: {
                type: "object",
                additionalProperties: {
                  type: "object",
                  properties: {
                    average_score: { type: "number" },
                    weight: { type: "number" },
                    contribution: { type: "number" },
                  },
                },
              },
              final_score: { type: "number" },
              rating: { type: "string" },
            }
          },
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

  StackRankRequest: {
    type: "object",
    required: ["challenge_id"],
    properties: {
      challenge_id: {
        type: "string",
        description:
          "Challenge identifier used to fetch and rank evaluated ideas",
      },
    },
  },

  StackRankResponse: {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Idea ID",
        },
        rank: {
          type: "integer",
          description: "1 = highest ranked idea",
        },
      },
    },
  },

  SnetIdeaCheckerRequest: {
    type: "object",
    required: ["newIdeaText"],
    properties: {
      newIdeaText: {
        type: "string",
        description: "Full idea text",
      },
    },
  },

  SnetIdeaCheckerResponse: {
    type: "object",
    properties: {
      feasibility_score: {
        type: "number",
      },
      idea_cluster: {
        type: "string",
      },
      cluster_id: {
        type: "integer",
      },
      most_similar_idea: {
        type: "object",
        properties: {
          idea_id: { type: "string" },
          similarity_score: { type: "number" },
        },
      },
    },
  },

  UnifiedIdeaCheckerRequest: {
    type: "object",
    required: ["newIdeaText"],
    properties: {
      newIdeaText: {
        type: "string",
        description: "Full idea text",
      },
    },
  },

  UnifiedIdeaCheckerResponse: {
    type: "object",
    properties: {
      feasibility_score: {
        type: "number",
      },
      idea_cluster: {
        type: "string",
      },
      cluster_id: {
        type: "integer",
      },
      most_similar_idea: {
        oneOf: [
          {
            type: "object",
            properties: {
              idea_id: { type: "string" },
              similarity_score: { type: "number" },
              explanation: {},
            },
          },
          {
            type: "object",
            properties: {
              idea_id: { type: "null" },
              similarity_score: { type: "null" },
              explanation: { type: "null" },
            },
          },
        ],
      },
    },
  },

  RFPEvaluationRequest: {
    type: "object",
    required: ["rfp", "proposal", "criteria"],
    properties: {
      rfp: {
        type: "object",
        description: "RFP details and requirements",
      },
      proposal: {
        type: "object",
        description: "Proposal details and claims",
      },
      criteria: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
          },
        },
      },
    },
  },

  RFPEvaluationResponse: {
    type: "object",
    properties: {
      status: { type: "string" },
      evaluation: {
        type: "object",
        properties: {
          scores: {
            type: "object",
            additionalProperties: {
              type: "object",
              properties: {
                score: { type: "number" },
                confidence: { type: "number" },
                reasoning: { type: "string" },
                strengths: {
                  type: "array",
                  items: { type: "string" },
                },
                weaknesses: {
                  type: "array",
                  items: { type: "string" },
                },
              },
            },
          },
          weights: {
            type: "object",
            additionalProperties: { type: "number" },
          },
          final_score: { type: "number" },
          decision: { type: "string" },
          summary: { type: "string" },
          key_strengths: {
            type: "array",
            items: { type: "string" },
          },
          key_risks: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
  }
};
