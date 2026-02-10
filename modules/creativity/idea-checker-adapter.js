import { pool } from "../../config/db.js";

async function fetchDeepIdeas() {
  try {
    const { rows } = await pool.query(`
        SELECT id, title, content, problem_description, proposed_solution, embedding, cluster_id
        FROM deep_ideation.ideas
        WHERE embedding IS NOT NULL AND cluster_id IS NOT NULL
      `);

    return rows.map((r) => ({
      idea_id: `deepfunding:${r.id}`,
      idea_text: [
        `Title: ${r.title}`,
        r.problem_description,
        r.proposed_solution,
      ].join("\n\n"),
      embedding: r.embedding,
      cluster_id: r.cluster_id,
      source: "deepfunding",
    }));
  } catch (error) {
    console.error("Error fetching existing ideas:", error);
    throw error;
  }
}

function l2norm(vec) {
  let s = 0;
  for (let i = 0; i < vec.length; i++) s += vec[i] * vec[i];
  return Math.sqrt(s) || 1;
}

function cosine(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  const na = l2norm(a);
  const nb = l2norm(b);
  return na && nb ? dot / (na * nb) : 0;
}

function convertCosineToScore(sim) {
  return Math.round((sim + 1) * 50 * 100) / 100; // two decimals
}

function textSimilarity(a, b) {
  const tokenize = (s) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

  const A = tokenize(a);
  const B = tokenize(b);

  if (A.size === 0 || B.size === 0) return 0;

  let intersection = 0;
  for (const w of A) {
    if (B.has(w)) intersection++;
  }

  const union = A.size + B.size - intersection;
  return intersection / union; // 0 → 1
}

function removeDuplicatesByText(newText, candidates) {
  return candidates.filter((c) => {
    const sim = textSimilarity(newText, c.idea_text);
    return sim <= 0.95;
  });
}



export async function runIdeaCheckerWithContext({
  ideaText,
  embedding,
  cluster_id,
}) {
  // 1. Fetch existing ideas (already embedded & clustered)
  const corpus = await fetchDeepIdeas();

  // 2. Restrict to same cluster (HUGE speed + quality win)
  const sameCluster = corpus.filter((idea) => idea.cluster_id === cluster_id);

  if (sameCluster.length === 0) {
    return {
      similarity_score: null,
      most_similar_idea: null,
    };
  }

  // 3. Remove near-duplicates by text (reuse logic)
  const deduped = removeDuplicatesByText(ideaText, sameCluster);

  let best = null;

  for (const candidate of deduped) {
    const sim = cosine(embedding, candidate.embedding);
    const score = convertCosineToScore(sim);

    if (!best || score > best.score) {
      best = {
        idea_id: candidate.idea_id,
        score,
      };
    }
  }

  // 4. Apply same threshold rules as main checker
  if (!best || best.score < 20) {
    return {
      similarity_score: null,
      most_similar_idea: null,
    };
  }

  return {
    similarity_score: best.score,
    most_similar_idea: best.idea_id,
  };
}
