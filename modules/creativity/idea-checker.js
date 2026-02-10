import { ethers } from "ethers";
import { runFeasibilityAnalysis } from "./analyse.js";
import { embedIdea, ensureClusters, assignClusterFromCentroids, removeDuplicatesByText, cosine, convertCosineToScore, extractSharedKeywords, explainSimilarity, fetchDeepIdeas, fetchWithTimeout} from "../utils/index.js";

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
    if (!Array.isArray(item.embedding) || item.embedding.length === 0) {
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

    try {
      explanation = await explainSimilarity({
        newIdeaText,
        matchedIdea,
        similarityScore: bestMatch.score,
        sharedKeywords,
      });
    } catch (error) {
      console.warn("[EXPLAIN] Failed, continuing without explanation");
      explanation = null;
    }
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
