import ExecuteState from "./execute.js";
import { loadAgents } from "../../agents/loader.js";

export default {
  async run(ctx, machine) {
    // Challenge decides which agents to run
    const focusAreas =
      ctx.challengeConfig?.focus_areas ||
      Object.keys(ctx.challengeConfig?.default_agents || {});

    // Load agent definitions dynamically
    ctx.plan = loadAgents(focusAreas).map((agent, idx) => ({
      step: idx + 1,
      agentId: agent.id,
      outputKey: agent.outputKey,
    }));

    // Always include classification unless explicitly disabled
    if (!ctx.plan.includes("classification")) {
      ctx.plan.push({
        agent: "classification",
      });
    }

    ctx.logs.push({
      state: "PLAN",
      agents: ctx.plan.map((p) => p.agentId),
    });

    return machine.transition(ExecuteState);
  },
};
