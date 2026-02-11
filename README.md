# 🧠 Agentic Idea Evaluation System

A production-grade, modular AI evaluation engine designed to:

* Evaluate ideas across configurable focus areas
* Dynamically adapt to different challenge configurations
* Classify ideas semantically
* Detect similarity across Deep Funding + SNET ecosystems
* Rank ideas fairly within clusters
* Never allow a single failure to break the pipeline

This is not just an LLM wrapper.

It is a deterministic orchestration system built around a state machine, agent isolation, clustering, and similarity intelligence.

---

# 🎯 What This System Solves

Traditional AI evaluation systems:

* Break if one agent fails
* Hardcode scoring logic
* Lack semantic clustering
* Produce unstable classifications
* Cannot detect duplicate ideas reliably
* Cannot adapt to different challenges dynamically

This system fixes all of that.

---

# 🏗 System Architecture

The system is divided into four layers:

```
Controller Layer
    ↓
Orchestrator (State Machine)
    ↓
Agent Layer (Scoring + Classification)
    ↓
Similarity & Corpus Engine
```

Each layer is fully isolated.

---

# 🔁 Execution Flow (Agentic Evaluation)

```
INIT → PLAN → EXECUTE → AGGREGATE → IDEA_CHECKER → FINALIZE
```

---

## 1️⃣ INIT

* Creates a clean execution context
* Ensures isolation between runs
* Initializes logs, results, and final containers

No heavy logic here.

---

## 2️⃣ PLAN

Dynamic agent selection happens here.

Agents are chosen based on:

```js
challengeConfig.focus_areas
```

This allows:

* Agriculture challenge → agriculture-relevant agents
* Health challenge → health-relevant agents
* Custom challenge → custom evaluation stack

Classification is appended automatically unless disabled.

This makes the system:

* Configurable
* Challenge-aware
* Reusable across domains

---

## 3️⃣ EXECUTE

This is the intelligence core.

### Shared Infrastructure (Runs Once)

* Embedding generation
* Clustering

These outputs are reused by:

* Similarity engine
* Classification
* Ranking systems

This avoids repeated compute and improves cost control.

---

### Agent Execution Loop

Each agent:

* Receives structured input
* Runs independently
* Returns structured output
* Cannot crash the system

If an agent fails:

```js
score = null
```

Evaluation continues.

This is deliberate design.

---

### Classification Agent

Unlike scoring agents, classification:

* Does NOT return a score
* Returns semantic metadata
* Is stable (low temperature)

Outputs:

```
idea_category
idea_cluster
```

This allows:

* UI grouping
* Portfolio segmentation
* Ranking normalization
* Trend analysis

---

## 4️⃣ AGGREGATE

This state:

* Normalizes outputs
* Ensures embedding + cluster_id are attached
* Prepares data for similarity detection

No intelligence is added here.
Only structured consolidation.

---

## 5️⃣ IDEA_CHECKER

This is the cross-ecosystem similarity engine.

It searches across:

* Deep Funding repository
* SNET GitHub repositories
* SNET Marketplace systems

Process:

1. Restrict to same cluster
2. Remove near-text duplicates
3. Compute cosine similarity
4. Convert similarity to score
5. Apply threshold (<20 → null)
6. Optionally generate explanation

Similarity failure never blocks evaluation.

---

## 6️⃣ FINALIZE

Formats structured output into:

* Scores
* Similarity
* Classification
* Infrastructure metadata
* Logs

No database writes occur here.

Frontend owns persistence.

---

# 🧠 Agent Model

There are two types of agents.

---

## Scoring Agents

Return:

```
{
  score: number,
  confidence: number
}
```

Score range: 0–100

Examples:

* conceptual_feasibility
* scalability_potential
* challenge_alignment
* adoption_plausibility

---

## Classification Agent

Returns:

```
{
  idea_category: string,
  idea_cluster: string
}
```

No score.
No explanation.
Strict JSON.

---

# 🔍 Standalone Idea Checkers

The system includes three similarity modes:

---

### 1️⃣ Agentic Evaluation Similarity

Used inside `/submitidea`.

Cluster-restricted.
Fast.
Context-aware.

---

### 2️⃣ SNET Idea Checker

Searches only SNET ecosystem.

Returns:

* feasibility_score
* idea_cluster
* cluster_id
* most_similar_idea

---

### 3️⃣ Unified Idea Checker

Searches:

* Deep Funding
* SNET GitHub
* SNET Marketplace

Includes explanation generation.

Used when cross-platform duplication risk must be evaluated.

---

# 📊 Stack Ranking Engine

Stack ranking is cluster-aware.

Why this matters:

Comparing a “Legal AI” idea to a “Farmer AI” idea directly is unfair.

So the system:

1. Groups by cluster_id
2. Normalizes scores within cluster
3. Applies weighted composite formula
4. Sorts descending

This ensures:

* Domain fairness
* Cluster equity
* Explainable ranking

---

# 🛡 Reliability Guarantees

* Agent failure isolation
* Similarity failure isolation
* Cluster-restricted search
* Deterministic classification
* Configurable focus areas
* No implicit side effects
* Structured logs for debugging
* Swagger-driven contract enforcement

---

# 🔧 Extending the System

To add a new scoring agent:

1. Create agent file
2. Add to registry
3. Add to focus_areas list
4. Ensure outputKey matches schema

No changes required in state machine.

To add a new evaluation dimension:

* Define agent
* Add to challenge focus_areas
* System automatically plans it

---

# 🔐 Design Philosophy

This system is built around five principles:

### 1️⃣ Determinism

Low temperature where classification stability is required.

### 2️⃣ Isolation

No agent can crash the pipeline.

### 3️⃣ Reusability

Challenge config drives behavior.

### 4️⃣ Semantic Awareness

Clustering + embeddings power everything.


# 🚀 Integration Guidance

When integrating:

* Always persist evaluation output externally
* Do not mutate evaluation results post-generation
* Treat similarity score as advisory, not deterministic rejection
* Use classification for UI grouping
* Use ranking only within cluster context
