import { StateMachine } from "./stateMachine.js";
import InitState from "./states/init.js";

export async function runAgenticEvaluation({
  new_idea,
  challengeConfig,
  author_id,
  idea_id,
}) {
  const context = {
    new_idea,
    challengeConfig,
    author_id,
    idea_id,
    plan: [],
    results: {},
    final: null,
    logs: [],
  };

  const machine = new StateMachine(InitState, context);
  return machine.run();
}
