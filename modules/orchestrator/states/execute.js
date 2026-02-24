// modules/orchestrator/states/execute.js

import AggregateState from "./aggregate.js";
import { AGENT_REGISTRY } from "../../agents/registry.js";
import { embedIdea, runClustering } from "../../utils/index.js";

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
        ctx.results.embedding = await embedIdea(ctx.new_idea);
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
        agent.id === "context_awareness" || agent.id === "challenge_alignment"
          ? {
              new_idea: ctx.new_idea,
              challengeContext: ctx.challengeConfig,
            }
          : {
              new_idea: ctx.new_idea,
            };

      try {
        const result = await agent.run(agentInput);

        // ctx.final[agent.outputKey] =
        //   typeof result?.score === "number" ? result.score : null;

        // If multi-model array
        if (Array.isArray(result?.[agent.outputKey])) {
          ctx.final[agent.outputKey] = result[agent.outputKey];
        }
        // If legacy single-score agent
        else if (typeof result?.score === "number") {
          ctx.final[agent.outputKey] = result.score;
        }
        // Otherwise null
        else {
          ctx.final[agent.outputKey] = result ?? null;
        }

        // Keep full agent output for audits / debugging
        ctx.results[agent.id] = result;

        // ctx.logs.push({
        //   state: "EXECUTE",
        //   agent: agent.id,
        //   outputKey: agent.outputKey,
        //   score: ctx.final[agent.outputKey],
        //   confidence: result?.confidence ?? null,
        // });
        ctx.logs.push({
          state: "EXECUTE",
          agent: agent.id,
          outputKey: agent.outputKey,
          score: ctx.final[agent.outputKey],
          confidence:
            typeof result?.confidence === "number" ? result.confidence : null,
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
