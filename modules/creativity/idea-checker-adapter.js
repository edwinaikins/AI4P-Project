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
  // 0. Guard: embedding must be usable
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
  // 1. Fetch existing ideas (already embedded)
  // --------------------------------------------
  const corpus = await fetchDeepIdeas();

  if (!Array.isArray(corpus) || corpus.length === 0) {
    return {
      similarity_score: null,
      most_similar_idea: null,
    };
  }

  // --------------------------------------------
  // 2. Restrict to same cluster
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
  // 3. Remove near-duplicates by text
  // --------------------------------------------
  
  const deduped = removeDuplicatesByText(ideaText, sameCluster);

  let best = null;

  // --------------------------------------------
  // 4. Find best cosine match
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
  // 5. Apply threshold (same as standalone)
  // --------------------------------------------
  if (!best || best.score < 20) {
    return {
      similarity_score: null,
      most_similar_idea: null,
    };
  }

  // --------------------------------------------
  // 6. Optional explanation (best-effort)
  // --------------------------------------------
  let explanation = null;

  try {
    explanation = await explainSimilarity({
      newIdeaText: ideaText,
      matchedIdea: best.candidate,
      similarityScore: best.score,
      sharedKeywords: [], // optional, can add later
    });
  } catch {
    explanation = null;
  }

  // --------------------------------------------
  // 7. Return normalized result
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
