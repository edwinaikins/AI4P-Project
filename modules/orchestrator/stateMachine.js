export class StateMachine {
  constructor(initialState, context) {
    this.state = initialState;
    this.context = context;
  }

  async transition(nextState) {
    this.state = nextState;
    return this.run();
  }

  async run() {
    return this.state.run(this.context, this);
  }
}
