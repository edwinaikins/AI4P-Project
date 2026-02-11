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
                "classification",
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


  StackRankRequest: {
    type: "object",
    required: ["challenge_id"],
    properties: {
      challenge_id: {
        type: "string",
        description: "Challenge identifier used to fetch and rank evaluated ideas"
      }
    }
  },
  
  StackRankResponse: {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Idea ID"
        },
        rank: {
          type: "integer",
          description: "1 = highest ranked idea"
        }
      }
    }
  },
  

  SnetIdeaCheckerRequest: {
    type: "object",
    required: ["newIdeaText"],
    properties: {
      newIdeaText: {
        type: "string",
        description: "Full idea text"
      }
    }
  },
  
  SnetIdeaCheckerResponse: {
    type: "object",
    properties: {
      feasibility_score: {
        type: "number"
      },
      idea_cluster: {
        type: "string"
      },
      cluster_id: {
        type: "integer"
      },
      most_similar_idea: {
        type: "object",
        properties: {
          idea_id: { type: "string" },
          similarity_score: { type: "number" }
        }
      }
    }
  },


  UnifiedIdeaCheckerRequest: {
    type: "object",
    required: ["newIdeaText"],
    properties: {
      newIdeaText: {
        type: "string",
        description: "Full idea text"
      }
    }
  },
  
  UnifiedIdeaCheckerResponse: {
    type: "object",
    properties: {
      feasibility_score: {
        type: "number"
      },
      idea_cluster: {
        type: "string"
      },
      cluster_id: {
        type: "integer"
      },
      most_similar_idea: {
        oneOf: [
          {
            type: "object",
            properties: {
              idea_id: { type: "string" },
              similarity_score: { type: "number" },
              explanation: {}
            }
          },
          {
            type: "object",
            properties: {
              idea_id: { type: "null" },
              similarity_score: { type: "null" },
              explanation: { type: "null" }
            }
          }
        ]
      }
    }
  }  
  
};
