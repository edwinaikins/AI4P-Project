import { pool } from "../../config/db.js";
import { GoogleAuth } from "google-auth-library";
import { ethers } from "ethers";
import { kmeans } from "ml-kmeans";

// ---------------------------
// CONFIG
// ---------------------------
const ETH_RPC = process.env.ETH_RPC || "https://cloudflare-eth.com";
const REGISTRY_ADDRESS =
  process.env.REGISTRY_ADDRESS || "0xF3E94b3C1F7f5a5cF5D9f4C1b7E69A7c3E0A4B2F";
const REGISTRY_ABI = [
  "function getOrganizations() view returns (bytes32[])",
  "function getServicesForOrganization(bytes32) view returns (bytes32[])",
  "function isServiceActive(bytes32, bytes32) view returns (bool)",
  "function getServiceMetadataURI(bytes32, bytes32) view returns (string)",
];

const GITHUB_ORGS = (
  process.env.GITHUB_ORGS || "singnet,opencog,singularitynet"
)
  .split(",")
  .map((s) => s.trim());
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

async function getAuthToken() {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

const PROJECT_ID = "ai4p-463319";
const REGION = "us-central1";

const EMBEDDING_MODEL = "text-embedding-005";
const OUTPUT_DIM = 256;

// New Flow for Idea checker using multiple sources, (Deep, SNET github repo and SNET marketplace)

let GLOBAL_CENTROIDS = null;

//timeout
function fetchWithTimeout(resource, options = {}, timeout = 30000) {
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
async function embedIdea(ideaText, model = EMBEDDING_MODEL) {
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

function ensureClusters(ideas) {
  const needsClustering = ideas.some((i) => i.cluster_id == null);

  if (!needsClustering && GLOBAL_CENTROIDS) return;

  const embeddings = ideas.map((i) => i.embedding.map(Number));
  const N = embeddings.length || 1;
  const K = Math.min(50, Math.max(2, Math.round(Math.sqrt(N))));

  console.log(`[CLUSTER] Running KMeans (N=${N}, K=${K})`);

  const km = kmeans(embeddings, K, {
    seed: 42,
    maxIterations: 100,
  });

  GLOBAL_CENTROIDS = km.centroids.map((c) => c.centroid);

  for (let i = 0; i < ideas.length; i++) {
    ideas[i].cluster_id = Number(km.clusters[i]);
  }
}

function cosineSimilarity(a, b) {
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

function assignClusterFromCentroids(embedding) {
  if (!GLOBAL_CENTROIDS || GLOBAL_CENTROIDS.length === 0) {
    throw new Error("Centroids not initialized. Call ensureClusters first.");
  }

  let bestIdx = 0;
  let bestSim = -Infinity;

  for (let i = 0; i < GLOBAL_CENTROIDS.length; i++) {
    const sim = cosineSimilarity(embedding, GLOBAL_CENTROIDS[i]);
    if (sim > bestSim) {
      bestSim = sim;
      bestIdx = i;
    }
  }

  return bestIdx;
}

function extractSharedKeywords(textA, textB, minLen = 3) {
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

// ---------------------------
// Marketplace raw fetch (on-chain + IPFS) — returns raw text items (no embeddings, no clusters)
// ---------------------------
async function fetchMarketplaceIdeasRaw() {
  console.log("[SNET-MARKET] Fetching marketplace services on-chain (raw)...");
  const provider = new ethers.JsonRpcProvider(ETH_RPC);
  const registry = new ethers.Contract(
    REGISTRY_ADDRESS,
    REGISTRY_ABI,
    provider
  );

  function decodeId(bytes32) {
    try {
      return ethers.decodeBytes32String(bytes32);
    } catch {
      if (typeof bytes32 === "string") return bytes32;
      return String(bytes32);
    }
  }
  function resolveIPFS(uri) {
    if (!uri) return null;
    if (uri.startsWith("ipfs://"))
      return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
    return uri;
  }

  const out = [];
  let orgIds = [];
  try {
    orgIds = await registry.getOrganizations();
  } catch (e) {
    console.warn("[SNET-MARKET] getOrganizations error:", e.message);
    return out;
  }

  for (const orgId of orgIds) {
    let serviceIds = [];
    try {
      serviceIds = await registry.getServicesForOrganization(orgId);
    } catch (e) {
      continue;
    }

    for (const serviceId of serviceIds) {
      try {
        const active = await registry.isServiceActive(orgId, serviceId);
        if (!active) continue;
        let metadataURI = "";
        try {
          metadataURI = await registry.getServiceMetadataURI(orgId, serviceId);
        } catch {}
        let metadata = {};
        if (metadataURI) {
          try {
            const url = resolveIPFS(metadataURI);
            const res = await fetchWithTimeout(url, {}, 10000);
            if (res.ok) metadata = await res.json();
          } catch (e) {
            // ignore IPFS fetch errors
          }
        }
        const org = decodeId(orgId);
        const svc = decodeId(serviceId);
        const title = metadata.name || svc;
        const desc = metadata.description || metadata.long_description || "";
        const tags = metadata.tags || metadata.categories || [];

        const idea_text = [
          `Title: ${title}`,
          `Source: SingularityNET Marketplace`,
          `Organization: ${org}`,
          `Service: ${svc}`,
          `Tags: ${Array.isArray(tags) ? tags.join(", ") : tags}`,
          `Description:\n${desc}`,
          `MetadataURI: ${metadataURI || ""}`,
        ].join("\n\n");

        out.push({
          idea_id: `snet:${org}/${svc}`,
          idea_text,
          source: "marketplace",
          raw_metadata: metadata,
        });
      } catch (e) {
        // per-service failures shouldn't break the loop
        console.warn("[SNET-MARKET] service processing error:", e.message);
      }
    }
  }

  console.log(`[SNET-MARKET] fetched ${out.length} services (raw).`);
  return out;
}

// ---------------------------
// GitHub raw fetch (repos + README) — returns raw text items (no embeddings, no clusters)
// ---------------------------
async function fetchGitHubIdeasRaw() {
  console.log(
    "[GITHUB] Fetching GitHub repos for orgs:",
    GITHUB_ORGS.join(", ")
  );
  const headers = { Accept: "application/vnd.github.v3+json" };
  if (GITHUB_TOKEN) headers.Authorization = `token ${GITHUB_TOKEN}`;

  const out = [];

  for (const org of GITHUB_ORGS) {
    let page = 1;
    while (true) {
      const url = `https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}`;
      const res = await fetchWithTimeout(url, { headers }, 15000);
      if (!res.ok) break;
      const repos = await res.json();
      if (!repos || repos.length === 0) break;

      for (const r of repos) {
        try {
          // fetch raw README
          const readmeUrl = `https://api.github.com/repos/${org}/${r.name}/readme`;
          const rres = await fetchWithTimeout(
            readmeUrl,
            {
              headers: { ...headers, Accept: "application/vnd.github.v3.raw" },
            },
            10000
          );
          let readme = "";
          if (rres.ok) readme = await rres.text();

          const idea_text = [
            `Title: ${r.full_name}`,
            `Source: GitHub`,
            `Repo: ${r.name}`,
            `Description: ${r.description || ""}`,
            `README:\n${readme ? readme.slice(0, 20_000) : ""}`,
          ].join("\n\n");

          out.push({
            idea_id: `github:${r.full_name}`,
            idea_text,
            source: "github",
            raw_repo: { url: r.html_url, language: r.language },
          });
        } catch (e) {
          // swallow per-repo errors
        }
      }

      if (repos.length < 100) break;
      page += 1;
    }
  }

  console.log(`[GITHUB] fetched ${out.length} repos (raw).`);
  return out;
}

async function buildUnifiedCorpus() {
  const [df, market, github] = await Promise.all([
    fetchDeepIdeas(),
    fetchMarketplaceIdeasRaw(),
    fetchGitHubIdeasRaw(),
  ]);

  const raw = [...df, ...market, ...github];

  // Only embed + cluster if missing
  const groomed = [];
  for (const item of raw) {
    if (!item.embedding) {
      item.embedding = await embedIdea(item.idea_text);
    }
    groomed.push(item);
  }

  // One global KMeans model (persisted)
  ensureClusters(groomed);

  return groomed;
}

async function groomNewIdea(newIdeaText) {
  const embedding = await embedIdea(newIdeaText);
  const cluster_id = assignClusterFromCentroids(embedding);

  return {
    idea_id: "submission:new",
    idea_text: newIdeaText,
    embedding,
    cluster_id,
    source: "submission",
  };
}

function findBestMatch(newIdea, corpus) {
  const sameCluster = corpus.filter((c) => c.cluster_id === newIdea.cluster_id);

  const deduped = removeDuplicatesByText(newIdea.idea_text, sameCluster);

  let best = null;
  for (const cand of deduped) {
    const sim = cosine(newIdea.embedding, cand.embedding);
    const score = convertCosineToScore(sim);

    if (score >= 20 && (!best || score > best.score)) {
      best = { idea_id: cand.idea_id, score };
    }
  }

  return best;
}

async function explainSimilarity({
  newIdeaText,
  matchedIdea,
  similarityScore,
  sharedKeywords,
}) {
  const systemPrompt = `
  You are an AI reviewer explaining why two ideas are similar.
  
  Rules:
  - Do NOT calculate similarity
  - Do NOT suggest acceptance or rejection
  - Explain overlap and differences clearly
  - 3–6 bullet points maximum
  `;

  const userPrompt = JSON.stringify({
    new_idea: newIdeaText,
    matched_idea: {
      idea_id: matchedIdea.idea_id,
      source: matchedIdea.source,
      text: matchedIdea.idea_text,
    },
    similarity_score: similarityScore,
    shared_keywords: sharedKeywords,
  });

  return await callLLM(systemPrompt, userPrompt);
}

export async function runUnifiedIdeaChecker(newIdeaText) {
  const corpus = await buildUnifiedCorpus();
  // ENSURE centroids exist BEFORE new idea
  ensureClusters(corpus);
  const newIdea = await groomNewIdea(newIdeaText);

  const feasibility_score = await runFeasibilityAnalysis(newIdeaText);
  const bestMatch = findBestMatch(newIdea, corpus);

  let explanation = null;

  if (bestMatch && bestMatch.score >= 20) {
    const matchedIdea = corpus.find((c) => c.idea_id === bestMatch.idea_id);

    const sharedKeywords = extractSharedKeywords(
      newIdea.idea_text,
      matchedIdea.idea_text
    );

    explanation = await explainSimilarity({
      newIdeaText,
      matchedIdea,
      similarityScore: bestMatch.score,
      sharedKeywords,
    });
  }

  return {
    feasibility_score,
    idea_cluster: `cluster_${newIdea.cluster_id}`,
    cluster_id: newIdea.cluster_id,
    most_similar_idea: bestMatch
      ? {
          idea_id: bestMatch.idea_id,
          similarity_score: bestMatch.score,
          explanation,
        }
      : {
          idea_id: null,
          similarity_score: null,
          explanation: null,
        },
  };
}
