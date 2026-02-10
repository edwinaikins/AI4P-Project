// states/finalize.js

export default {
    async run(ctx) {
      return {
        status: "success",
        evaluation: {
          scores: Object.fromEntries(
            Object.entries(ctx.final).filter(([k]) => k.endsWith("_score"))
          ),
  
          similarity: {
            similarity_score: ctx.final.similarity_score ?? null,
            most_similar_idea: ctx.final.most_similar_idea ?? null
          },
  
          classification: {
            idea_category: ctx.final.idea_category ?? null,
            idea_cluster: ctx.final.idea_cluster ?? null,
            cluster_id: ctx.final.cluster_id ?? null
          },
  
          infrastructure: {
            embedding: ctx.final.embedding ?? null
          }
        },
        logs: ctx.logs
      };
    }
  };
  