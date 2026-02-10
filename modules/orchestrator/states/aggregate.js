// states/aggregate.js
import ideaCheckState from "./ideaCheck.js";

export default {
  async run(ctx, machine) {
    ctx.final = {
      ...ctx.results.feasibility,
      ...ctx.results.impact,
      ...ctx.results.ethics,
      ...ctx.results.clarity,
      ...ctx.results.cluster,
      embedding: ctx.results.embedding
    }

    ctx.logs.push({ state: "AGGREGATE", ok: true })
    return machine.transition(ideaCheckState)
  }
}
