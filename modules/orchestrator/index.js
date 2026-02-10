import { StateMachine } from "./stateMachine.js";
import InitState from "./states/init.js";

export async function runAgenticEvaluation({
  new_idea,
  challengeConfig
}) {
  const context = {
    new_idea,
    challengeConfig,
    plan: [],
    results: {},
    final: null,
    logs: [],
  };

  const machine = new StateMachine(InitState, context);
  return machine.run();
}
