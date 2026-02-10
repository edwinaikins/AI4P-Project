import { runIdeaCheckerWithContext } from "../../creativity/idea-checker-adapter.js";
import FinalizeState from "./finalize.js";

export default {
  async run(ctx, machine) {
    try {
      const result = await runIdeaCheckerWithContext({
        ideaText: ctx.ideaText,
        embedding: ctx.results.embedding,
        cluster_id: ctx.results.cluster.cluster_id
      })

      ctx.results.similarity_score = result.similarity_score
      ctx.results.most_similar_idea = result.most_similar_idea
    } catch (err) {
      // similarity must NEVER block evaluation
      ctx.results.similarity_score = null
      ctx.results.most_similar_idea = null
    }

    ctx.logs.push({
      state: "IDEA_CHECKER",
      used_precomputed: true
    })

    return machine.transition(FinalizeState)
  }
}
