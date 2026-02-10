import { runIdeaCheckerWithContext } from "../../creativity/idea-checker-adapter.js";
import FinalizeState from "./finialize.js";

export default {
  async run(ctx, machine) {
    let usedPrecomputed = false;

    try {
      // Only skip computation if values already exist
      const hasPrecomputed =
        typeof ctx.final?.similarity_score === "number" &&
        ctx.final?.most_similar_idea;

      if (hasPrecomputed) {
        usedPrecomputed = true;
      } else {
        const result = await runIdeaCheckerWithContext({
          ideaText: ctx.ideaText,
          embedding: ctx.results.embedding,
          cluster_id: ctx.results.cluster?.cluster_id
        });

        // 🔑 WRITE TO ctx.final (NOT ctx.results)
        ctx.final.similarity_score = result.similarity_score ?? null;
        ctx.final.most_similar_idea = result.most_similar_idea ?? null;
      }
    } catch (err) {
      // similarity must NEVER block evaluation
      ctx.final.similarity_score = null;
      ctx.final.most_similar_idea = null;

      ctx.logs.push({
        state: "IDEA_CHECKER",
        error: err.message
      });
    }

    ctx.logs.push({
      state: "IDEA_CHECKER",
      used_precomputed: usedPrecomputed
    });

    return machine.transition(FinalizeState);
  }
};
