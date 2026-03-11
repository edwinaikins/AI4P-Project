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
    }

    // DO NOT override idea_cluster if classification set it
    if (!ctx.final.idea_cluster && ctx.results?.classification?.idea_cluster) {
      ctx.final.idea_cluster = ctx.results.classification.idea_cluster;
    }

    if (
      !ctx.final.idea_category &&
      ctx.results?.classification?.idea_category
    ) {
      ctx.final.idea_category = ctx.results.classification.idea_category;
    }

    // --------------------------------------------
    // NEW: Weighted rating computation
    // --------------------------------------------

    const focusAreas = ctx.challengeConfig?.focus_areas || [];

    const totalWeight = focusAreas.reduce(
      (sum, area) => sum + (area.weight || 0),
      0
    );

    if (Math.abs(totalWeight - 1) > 0.001) {
      throw new Error(
        `Focus area weights must sum to 1. Received ${totalWeight}`
      );
    }

    let finalScore = 0;
    const breakdown = {};

    for (const area of focusAreas) {
      const key = `${area.id}_score`;

      const modelScores = ctx.final[key];

      if (!Array.isArray(modelScores) || modelScores.length === 0) continue;

      const avg =
        modelScores.reduce((sum, m) => sum + (m.score || 0), 0) /
        modelScores.length;

      const contribution = avg * area.weight;

      finalScore += contribution;

      breakdown[area.id] = {
        average_score: Number(avg.toFixed(2)),
        weight: area.weight,
        contribution: Number(contribution.toFixed(2)),
      };
    }

    // Determine rating
    let rating = "Poor";

    if (finalScore >= 90) rating = "Excellent";
    else if (finalScore >= 80) rating = "Very Good";
    else if (finalScore >= 70) rating = "Good";
    else if (finalScore >= 50) rating = "Average";

    ctx.final.rating_summary = {
      focus_area_breakdown: breakdown,
      final_score: Number(finalScore.toFixed(2)),
      rating,
    };

    ctx.logs.push({
      state: "AGGREGATE",
      scores_collected: Object.keys(ctx.final).filter((k) =>
        k.endsWith("_score")
      ),
      rating_generated: true,
      ok: true,
    });

    return machine.transition(ideaCheckState);
  },
};
