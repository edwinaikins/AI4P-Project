# 🧠 Agentic Multi-LLM Idea Evaluation System

This system evaluates ideas using multiple LLMs in parallel, semantic clustering, and similarity detection.

It is built as a deterministic state machine that:

* Selects evaluation agents dynamically
* Runs multiple LLMs per agent
* Prevents single failures from breaking the pipeline
* Detects similar ideas within the ecosystem
* Returns structured, transparent results

---

# 🔎 Two Main Entry Points

The system has two primary flows:

1. **`/submitidea`** → Full evaluation
2. **`/ideachecker`** → Similarity-only check

Each flow uses the same infrastructure but serves different purposes.

---

# 🚀 Flow 1: `/submitidea`

This is the full evaluation pipeline.

---

## 📥 What the Request Contains

When `/submitidea` is called, the request includes:

```json
{
  "new_idea": "string",
  "challengeConfig": {
    "focus_areas": [
      "conceptual_feasibility",
      "scalability_potential",
      "challenge_alignment"
    ]
  }
}
```

### Explanation

* `new_idea` → The idea text to evaluate
* `challengeConfig.focus_areas` → Determines which scoring agents will run

The system does not hardcode evaluation dimensions.

Everything is driven by `challengeConfig`.

---

# 🔁 Execution Lifecycle

The system runs as a state machine:

```
INIT → PLAN → EXECUTE → AGGREGATE → IDEA_CHECKER → FINALIZE
```

---

## 1️⃣ INIT

Creates a clean execution context:

* `ctx.results`
* `ctx.final`
* `ctx.logs`

Each evaluation run is fully isolated.

---

## 2️⃣ PLAN

The system reads:

```js
challengeConfig.focus_areas
```

For example:

```js
[
  "conceptual_feasibility",
  "adoption_plausibility",
  "challenge_alignment"
]
```

It dynamically builds:

```js
ctx.plan = [
  { agentId: "conceptual_feasibility" },
  { agentId: "adoption_plausibility" },
  { agentId: "challenge_alignment" }
]
```

No scoring logic is hardcoded in the state machine.

This makes the system:

* Challenge-aware
* Configurable
* Reusable across domains

---

## 3️⃣ EXECUTE

This is the core intelligence stage.

It does two things:

### A) Shared Infrastructure (Runs Once)

* Generate embedding for the idea
* Assign cluster_id via K-Means

These outputs power:

* Similarity restriction
* Cluster-aware ranking
* Duplicate detection

They are not generated per agent.
They are reused.

---

### B) Run Scoring Agents (Multi-LLM)

For each agent in the plan:

1. A prompt is constructed

2. `scoreWithAllModels()` is called

3. Four LLMs run in parallel:

   * Gemini
   * ASI-1 Mini
   * GPT-OSS-120B
   * LLaMA-3.3-70B Instruct

4. Each model returns structured JSON

5. Results are preserved as an array

Example output:

```json
"adoption_plausibility_score": [
  {
    "model": "gemini",
    "score": 75,
    "confidence": 0.8
  },
  {
    "model": "asi1-mini",
    "score": 92,
    "confidence": 0.94
  }
]
```

The system does not:

* Average scores
* Choose a winner
* Override any model

All outputs are returned transparently.

---

### Failure Handling

If one model fails:

```json
{ "model": "x", "score": null }
```

If one agent fails:

```json
"agent_score": null
```

The evaluation continues.

No single failure can crash the pipeline.

---

## 4️⃣ AGGREGATE

This stage:

* Collects all `_score` outputs
* Attaches embedding
* Attaches cluster_id
* Normalizes structure

No intelligence is added here.

This is structural consolidation only.

---

## 5️⃣ IDEA_CHECKER (Triggered Automatically)

After scoring, similarity is checked.

Process:

1. Restrict search to same `cluster_id`
2. Remove near-text duplicates (>95%)
3. Compute cosine similarity
4. Convert similarity to 0–100 score
5. Apply threshold (<20 → null)

Output:

```json
{
  "similarity_score": 93.1,
  "most_similar_idea": {
    "idea_id": "deepfunding:10006",
    "similarity_score": 93.1
  }
}
```

Similarity failure never blocks scoring.

---

## 6️⃣ FINALIZE

Returns structured output:

```json
{
  "scores": { ...multi-model score arrays... },
  "similarity": { ... },
  "infrastructure": {
    "embedding": [...],
    "cluster_id": 6
  },
  "logs": [...]
}
```

No database writes occur here.

Persistence is handled externally.

---

# 🔍 Flow 2: `/ideachecker`

This is a lighter-weight endpoint.

It does not run scoring agents.

It performs:

1. Embedding generation
2. Cluster assignment
3. Cluster-restricted similarity search
4. Cosine similarity computation
5. Optional explanation generation

Output:

```json
{
  "feasibility_score": <optional>,
  "cluster_id": 6,
  "most_similar_idea": {
    "idea_id": "...",
    "similarity_score": 88.2
  }
}
```

Use cases:

* Pre-submission duplicate check
* Ecosystem overlap analysis
* Cross-platform idea comparison

This endpoint is focused purely on similarity detection.

---

# 🧩 Agent Model

Each scoring agent:

* Is isolated
* Receives structured input
* Returns structured JSON
* Uses multi-LLM evaluation internally

Example agents:

* conceptual_feasibility
* scalability_potential
* complexity_awareness
* challenge_alignment
* adoption_plausibility
* context_awareness

Adding a new agent requires:

1. Creating agent file
2. Adding to registry
3. Referencing it in `challengeConfig`

No state machine changes required.

---

# 🛡 Reliability Design

The system guarantees:

* Agent-level isolation
* Model-level isolation
* Similarity isolation
* Cluster-aware fairness
* Deterministic infrastructure outputs
* Structured logging for debugging

---

# 🧠 What Makes This Different

This system is:

* Not a single-LLM evaluator
* Not a hardcoded scoring script
* Not a brittle prompt wrapper

It is:

A deterministic orchestration engine
Running multiple LLMs in parallel
Returning transparent, structured evaluation results
With similarity intelligence built in