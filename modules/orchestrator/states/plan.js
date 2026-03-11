import ExecuteState from "./execute.js";
import { loadAgents } from "../../agents/loader.js";

export default {
  async run(ctx, machine) {
    // Challenge decides which agents to run
    // const focusAreas =
    //   ctx.challengeConfig?.focus_areas ||
    //   Object.keys(ctx.challengeConfig?.default_agents || {});
    const rawFocusAreas =
      ctx.challengeConfig?.focus_areas ||
      Object.keys(ctx.challengeConfig?.default_agents || {});

    // Normalize focus areas to support both old and new formats
    const focusAreas = rawFocusAreas.map((fa) =>
      typeof fa === "string" ? fa : fa.id
    );

    // Load agent definitions dynamically
    ctx.plan = loadAgents(focusAreas).map((agent, idx) => ({
      step: idx + 1,
      agentId: agent.id,
      outputKey: agent.outputKey,
    }));

    // Always include classification unless explicitly disabled
    if (!ctx.plan.some((p) => p.agentId === "classification")) {
      ctx.plan.push({
        step: ctx.plan.length + 1,
        agentId: "classification",
        outputKey: "classification",
      });
    }

    ctx.logs.push({
      state: "PLAN",
      agents: ctx.plan.map((p) => p.agentId),
    });

    return machine.transition(ExecuteState);
  },
};
