import { callGemini } from "../../services/genai.service.js";
import { kmeans } from "ml-kmeans";
import { GoogleAuth } from "google-auth-library";
import { pool } from "../../config/db.js";

const PROJECT_ID = "ai4p-463319";
const REGION = "us-central1";

const EMBEDDING_MODEL = "text-embedding-005";
const OUTPUT_DIM = 256;

let GLOBAL_CENTROIDS = null;

async function getAuthToken() {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

//timeout
export function fetchWithTimeout(resource, options = {}, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    fetch(resource, {
      ...options,
      signal: controller.signal,
    })
      .then((response) => {
        clearTimeout(id);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(id);
        reject(error);
      });
  });
}

// embedding
export async function embedIdea(ideaText, model = EMBEDDING_MODEL) {
  if (!ideaText) return [];

  console.log(`[VERTEX] Embedding single idea...`);

  const token = await getAuthToken();
  const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${model}:predict`;

  async function attemptEmbed(attempt = 1) {
    try {
      const resp = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instances: [
              {
                content: ideaText,
                task_type: "SEMANTIC_SIMILARITY",
              },
            ],
            parameters: {
              outputDimensionality: OUTPUT_DIM,
              autoTruncate: true,
            },
          }),
        },
        30000
      );

      if (!resp.ok) {
        const bodyText = await resp.text().catch(() => "");
        throw new Error(
          `Embedding model error ${resp.status}. Body: ${bodyText.slice(
            0,
            350
          )}`
        );
      }

      const data = await resp.json();
      return data.predictions[0].embeddings.values;
    } catch (err) {
      console.warn(
        `[VERTEX] Single embedding failed (attempt ${attempt}/3): ${err.message}`
      );

      if (attempt < 3) {
        await new Promise((res) => setTimeout(res, 1200));
        return attemptEmbed(attempt + 1);
      }

      console.error(
        `[VERTEX] FINAL FAIL for single idea. Returning null embedding.`
      );
      return Array(OUTPUT_DIM).fill(0);
    }
  }

  const embedding = await attemptEmbed();

  console.log(`[VERTEX] Single idea embedded successfully.`);
  return embedding;
}

// format idea parts into an idea_text
export function formatIdeaRowAsObject(row) {
  // Construct the idea_text from the descriptive fields only
  const ideaTextObject = {
    "Idea Title": row.idea_title,
    "Problem Statement": row.problem_statement,
    "Proposed AI Solution": row.proposed_ai_solution,
    "Potential Impact": row.potential_impact,
    "Key Features/Functionality": row.key_features || [],
    "Technical Requirements (Optional)": row.technical_requirements || [],
    "Team (Optional)": row.team || "",
    "Keywords/Tags": row.keywords || [],
  };

  return {
    idea_id: row.id,
    idea_text: JSON.stringify(ideaTextObject), // Don't escape quotes; let JSON.stringify handle that
    embedding: Array.isArray(row.embedding) ? row.embedding.slice(0, 128) : [],
    cluster_id: parseInt(row.cluster_id),
  };
}

// convert idea_text from json to js object
export function parseIdeaTextToObject(ideaText) {
  try {
    const ideaObject = JSON.parse(ideaText);

    return {
      idea_title: ideaObject["Idea Title"] || "",
      problem_statement: ideaObject["Problem Statement"] || "",
      proposed_ai_solution: ideaObject["Proposed AI Solution"] || "",
      potential_impact: ideaObject["Potential Impact"] || "",
      key_features: ideaObject["Key Features/Functionality"] || [],
      technical_requirements:
        ideaObject["Technical Requirements (Optional)"] || [],
      team: ideaObject["Team (Optional)"] || "",
      keywords: ideaObject["Keywords/Tags"] || [],
    };
  } catch (err) {
    console.error("Failed to parse idea_text:", err);
    throw new Error("Invalid idea_text format");
  }
}

// clustering model
export async function runClustering(embedding) {
  try {
    const systemPrompt = `You are a senior AI solution architect. For each given embedding, perform the following steps in order:
      Cluster Assignment 
      Using a pre-trained K-Means model with k clusters (centroids provided separately), assign the idea’s embedding to its nearest cluster.  
      Record that as an integer cluster_id (0 through k-1).
      Your response must be returned as **valid JSON only**, with no explanations or extra text.
      Output format:
      {
        "cluster_id": <integer>,
      }`;

    const userInput = JSON.stringify({ embedding });
    const response = await callGemini(systemPrompt, userInput);
    console.log(response);
    return response;
  } catch (error) {
    console.log(error);
  }
}

// ---------------------------
// Scoring helpers
// ---------------------------
export function l2norm(vec) {
  let s = 0;
  for (let i = 0; i < vec.length; i++) s += vec[i] * vec[i];
  return Math.sqrt(s) || 1;
}

export function cosine(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  const na = l2norm(a);
  const nb = l2norm(b);
  return na && nb ? dot / (na * nb) : 0;
}

export function convertCosineToScore(sim) {
  return Math.round((sim + 1) * 50 * 100) / 100; // two decimals
}

export function textSimilarity(a, b) {
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

export function removeDuplicatesByText(newText, candidates) {
  return candidates.filter((c) => {
    const sim = textSimilarity(newText, c.idea_text);
    return sim <= 0.95;
  });
}

export function ensureClusters(ideas) {
  const validIdeas = ideas.filter(
    (i) => Array.isArray(i.embedding) && i.embedding.length > 0
  );

  if (validIdeas.length === 0) {
    throw new Error("No valid embeddings available for clustering.");
  }

  const needsClustering = ideas.some((i) => i.cluster_id == null);

  if (!needsClustering && GLOBAL_CENTROIDS) return;

  const embeddings = validIdeas.map((i) => i.embedding.map(Number));
  const N = embeddings.length || 1;
  const K = Math.min(50, Math.max(2, Math.round(Math.sqrt(N))));

  console.log(`[CLUSTER] Running KMeans (N=${N}, K=${K})`);

  const km = kmeans(embeddings, K, {
    seed: 42,
    maxIterations: 100,
  });

  GLOBAL_CENTROIDS = km.centroids.map((c) => c.centroid);

  for (let i = 0; i < validIdeas.length; i++) {
    validIdeas[i].cluster_id = Number(km.clusters[i]);
  }
}

export function cosineSimilarity(a, b) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

export function assignClusterFromCentroids(embedding) {
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Invalid embedding for new idea");
  }

  if (!GLOBAL_CENTROIDS || GLOBAL_CENTROIDS.length === 0) {
    throw new Error("Centroids not initialized. Call ensureClusters first.");
  }

  let bestIdx = 0;
  let bestSim = -Infinity;

  for (let i = 0; i < GLOBAL_CENTROIDS.length; i++) {
    const centroid = GLOBAL_CENTROIDS[i];

    if (!Array.isArray(centroid) || centroid.length !== embedding.length) {
      continue; // skip broken centroid
    }

    const sim = cosineSimilarity(embedding, GLOBAL_CENTROIDS[i]);
    if (sim > bestSim) {
      bestSim = sim;
      bestIdx = i;
    }
  }

  return bestIdx;
}

export function extractSharedKeywords(textA, textB, minLen = 3) {
  const tokenize = (s) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= minLen)
    );

  const A = tokenize(textA);
  const B = tokenize(textB);

  const shared = [];
  for (const w of A) {
    if (B.has(w)) shared.push(w);
  }

  return shared.slice(0, 20); // cap to avoid prompt bloat
}

export async function explainSimilarity({
  newIdeaText,
  matchedIdea,
  similarityScore,
  sharedKeywords,
}) {
  const systemPrompt = `
    You are an AI reviewer explaining why two ideas are similar.
    
    STRICT RULES:
    - You MUST return valid JSON only
    - Do NOT include markdown, bullets, or prose outside JSON
    - Do NOT calculate similarity
    - Do NOT suggest acceptance or rejection
    
    OUTPUT FORMAT (JSON ONLY):
    {
      "explanation_points": [
        "string",
        "string"
      ]
    }
    `;

  const userPrompt = JSON.stringify({
    new_idea: newIdeaText.slice(0, 800),
    matched_idea: {
      idea_id: matchedIdea.idea_id,
      source: matchedIdea.source,
      text: matchedIdea.idea_text.slice(0, 800),
    },
    similarity_score: similarityScore,
    shared_keywords: sharedKeywords,
  });

  const response = await callGemini(systemPrompt, userPrompt);

  // Normalize output
  return Array.isArray(response.explanation_points)
    ? response.explanation_points
    : [];
}

export async function fetchDeepIdeas() {
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

// RFP


export function aggregateModelResponses(responses) {
  const valid = responses.filter(
    (r) => !r.error && typeof r.score === "number"
  );

  if (!valid.length) {
    return {
      score: 0
    };
  }

  return {
    score: Number(avgScore.toFixed(2))
  };
}

export function synthesizeReasoning(responses) {
  return responses.map((r) => `[${r.model}] ${r.reasoning}`).join("\n");
}

export function normalizeWeights(criteria) {
  const total = criteria.reduce((sum, c) => sum + c.weight, 0);

  const weights = {};
  criteria.forEach((c) => {
    weights[c.name] = c.weight / total;
  });

  return weights;
}

export function computeWeightedScore(results, weights) {
  let total = 0;

  for (const key in results) {
    total += (results[key].score || 0) * (weights[key] || 0);
  }

  return Number(total.toFixed(2));
}

export function extractJSON(text) {
  if (!text) return null;

  try {
    // Remove markdown ```json ```
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Extract first JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);

    if (!match) return null;

    return JSON.parse(match[0]);
  } catch (err) {
    return null;
  }
}


function safeParseJSON(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    // 🔥 Extract FIRST valid JSON block
    const match = text.match(/\{[\s\S]*?\}/);

    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}


export function normalizeModelResponses(responses) {
  return responses.map((res) => {
    if (res.error) return res;

    if (typeof res.score === "number") return res;

    const parsed = safeParseJSON(res.output || res.text || "");

    if (!parsed) {
      return {
        model: res.model,
        error: "Parsing failed",
      };
    }

    return {
      model: res.model,
      score: parsed.score,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning
    };
  });
}