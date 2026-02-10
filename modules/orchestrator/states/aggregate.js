// states/aggregate.js
import ideaCheckState from "./ideaCheck.js";

export default {
  async run(ctx, machine) {
    // Ensure final exists (EXECUTE should have populated it)
    ctx.final = ctx.final || {};

    // --------------------------------------------
    // 1. Attach shared infra outputs
    // --------------------------------------------
    if (ctx.results?.embedding) {
      ctx.final.embedding = ctx.results.embedding;
    }

    if (ctx.results?.cluster) {
      ctx.final.cluster_id = ctx.results.cluster.cluster_id ?? null;
      ctx.final.idea_cluster = ctx.results.classification.idea_cluster ?? "Unclassified";
      ctx.final.idea_category = ctx.results.classification.idea_category ?? "Uncategorized";
    }


    ctx.logs.push({
      state: "AGGREGATE",
      scores_collected: Object.keys(ctx.final).filter(k =>
        k.endsWith("_score")
      ),
      ok: true
    });

    return machine.transition(ideaCheckState);
  }
};
