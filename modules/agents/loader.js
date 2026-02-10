import { AGENT_REGISTRY } from "./registry.js";

export function loadAgents(agentIds = []) {
  return agentIds.map((id) => {
    const agent = AGENT_REGISTRY[id];
    if (!agent) {
      throw new Error(`Unknown agent: ${id}`);
    }
    return agent;
  });
}
