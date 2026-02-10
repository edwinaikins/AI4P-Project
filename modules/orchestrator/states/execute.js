// modules/orchestrator/states/execute.js

import AggregateState from "./aggregate.js";
import { AGENT_REGISTRY } from "../../agents/registry.js";
import { embedIdea, runClustering } from "../../creativity/analyse.js"

export default {
  async run(ctx, machine) {
    // Ensure containers exist
    ctx.results = ctx.results || {};
    ctx.final = ctx.final || {};
    ctx.logs = ctx.logs || [];

    // --------------------------------------------------
    // 1. Run shared tools ONCE (embedding + clustering)
    // --------------------------------------------------

    try {
      if (!ctx.results.embedding) {
        ctx.results.embedding = await embedIdea(ctx.ideaText);
      }

      if (!ctx.results.cluster) {
        ctx.results.cluster = await runClustering(ctx.results.embedding);
      }
    } catch (err) {
      // Shared infra failure is serious but should not crash the run
      ctx.logs.push({
        state: "EXECUTE",
        error: "Shared tool failure",
        message: err.message,
      });

      ctx.results.embedding = null;
      ctx.results.cluster = null;
    }

    // --------------------------------------------------
    // 2. Execute agents dynamically (challenge-driven)
    // --------------------------------------------------

    for (const step of ctx.plan) {
      const agent = AGENT_REGISTRY[step.agentId];

      if (!agent) {
        ctx.logs.push({
          state: "EXECUTE",
          agent: step.agentId,
          error: "Agent not registered",
        });
        continue;
      }

      // Build agent input
      const agentInput =
        agent.id === "context_awareness" ||
        agent.id === "challenge_alignment"
          ? {
              ideaText: ctx.ideaText,
              challengeContext: ctx.challengeConfig,
            }
          : {
              ideaText: ctx.ideaText,
            };

      try {
        const result = await agent.run(agentInput);

        // Persist ONLY the score into final (DB-safe)
        ctx.final[agent.outputKey] =
          typeof result?.score === "number" ? result.score : null;

        // Keep full agent output for audits / debugging
        ctx.results[agent.id] = result;

        ctx.logs.push({
          state: "EXECUTE",
          agent: agent.id,
          outputKey: agent.outputKey,
          score: ctx.final[agent.outputKey],
          confidence: result?.confidence ?? null,
        });
      } catch (err) {
        // Agent failure must NOT break the evaluation
        ctx.final[agent.outputKey] = null;

        ctx.logs.push({
          state: "EXECUTE",
          agent: agent.id,
          error: err.message,
        });
      }
    }

    // --------------------------------------------------
    // 3. Attach shared infra outputs for downstream states
    // --------------------------------------------------

    ctx.final.embedding = ctx.results.embedding ?? null;
    ctx.final.cluster_id = ctx.results.cluster?.cluster_id ?? null;

    // --------------------------------------------------
    // 4. Transition to AGGREGATE
    // --------------------------------------------------

    return machine.transition(AggregateState);
  },
};
