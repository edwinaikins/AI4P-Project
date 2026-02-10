import { fetchDeepIdeas, cosine, convertCosineToScore, removeDuplicatesByText } from "../utils/index.js";


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
