// states/init.js
import PlanState from "./plan.js";

export default {
  async run(ctx, machine) {
    if (!ctx.new_idea) throw new Error("Missing idea text")
    ctx.logs.push({ state: "INIT", ok: true })
    return machine.transition(PlanState)
  }
}
