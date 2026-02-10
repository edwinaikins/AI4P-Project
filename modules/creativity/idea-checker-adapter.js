import {
  fetchDeepIdeas,
  cosine,
  convertCosineToScore,
  removeDuplicatesByText,
  explainSimilarity,
} from "../utils/index.js";

export async function runIdeaCheckerWithContext({
  ideaText,
  embedding,
  cluster_id,
}) {
  // --------------------------------------------
  // 0. Normalize incoming idea text (CRITICAL)
  // --------------------------------------------
  const safeIdeaText =
    typeof ideaText === "string" ? ideaText : JSON.stringify(ideaText ?? "");

  // --------------------------------------------
  // 1. Guard: embedding must be usable
  // --------------------------------------------
  if (
    !Array.isArray(embedding) ||
    embedding.length === 0 ||
    embedding.every((v) => v === 0)
  ) {
    return {
      similarity_score: null,
      most_similar_idea: null,
    };
  }

  // --------------------------------------------
  // 2. Fetch existing ideas (already embedded)
  // --------------------------------------------
  const corpus = await fetchDeepIdeas();

  if (!Array.isArray(corpus) || corpus.length === 0) {
    return {
      similarity_score: null,
      most_similar_idea: null,
    };
  }

  // --------------------------------------------
  // 3. Restrict to same cluster
  // --------------------------------------------
  const sameCluster = corpus.filter(
    (idea) => idea.cluster_id === cluster_id && Array.isArray(idea.embedding)
  );

  if (sameCluster.length === 0) {
    return {
      similarity_score: null,
      most_similar_idea: null,
    };
  }

  // --------------------------------------------
  // 4. Normalize corpus text for deduplication
  // --------------------------------------------
  const normalized = sameCluster.map((c) => ({
    ...c,
    idea_text:
      typeof c.idea_text === "string"
        ? c.idea_text
        : typeof c.problem_statement === "string"
        ? c.problem_statement
        : typeof c.description === "string"
        ? c.description
        : typeof c.title === "string"
        ? c.title
        : "",
  }));

  // --------------------------------------------
  // 5. Remove near-duplicates by text
  // --------------------------------------------
  const deduped = removeDuplicatesByText(safeIdeaText, normalized);

  let best = null;

  // --------------------------------------------
  // 6. Find best cosine match
  // --------------------------------------------
  for (const candidate of deduped) {
    if (!candidate.embedding) continue;

    const sim = cosine(embedding, candidate.embedding);
    const score = convertCosineToScore(sim);

    if (!best || score > best.score) {
      best = {
        idea_id: candidate.idea_id,
        score,
        candidate,
      };
    }
  }

  // --------------------------------------------
  // 7. Apply threshold (same as standalone)
  // --------------------------------------------
  if (!best || best.score < 20) {
    return {
      similarity_score: null,
      most_similar_idea: null,
    };
  }

  // --------------------------------------------
  // 8. Optional explanation (best-effort)
  // --------------------------------------------
  let explanation = null;

  try {
    explanation = await explainSimilarity({
      newIdeaText: safeIdeaText,
      matchedIdea: best.candidate,
      similarityScore: best.score,
      sharedKeywords: [],
    });
  } catch {
    explanation = null;
  }

  // --------------------------------------------
  // 9. Return normalized result
  // --------------------------------------------
  return {
    similarity_score: best.score,
    most_similar_idea: {
      idea_id: best.idea_id,
      similarity_score: best.score,
      explanation,
    },
  };
}
