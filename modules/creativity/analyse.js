import { callGemini } from '../../services/genai.service.js';

export async function runCreativityAnalysis(new_idea, existing_ideas) {
  const systemPrompt = `You are a senior AI solution architect. Given a new AI idea and a list of existing ideas, follow the steps below in order:
INPUT VALIDATION
Before proceeding with the steps below, ensure that the INPUTS conform to the following:
The "New Idea" must be a string.
The "Existing Ideas" must be a list of dictionaries. Each dictionary must contain the keys "idea_id" (string), "idea_text" (string), "embedding" (a list of floats), and "cluster_id" (integer).
The "embedding" must be a list of floats.
The "cluster_id" must be an integer.
Vector Embedding
Generate a fixed-length vector embedding for the user idea using the textembedding-gecko@001 model.
Include this as an array of floats under the key "embedding".
Cluster Assignment
Using a pre-trained K-Means model with k centroids (provided separately), assign the new idea’s embedding to its nearest cluster.
Return "cluster_id" as an integer from 0 to k-1.
Technical Feasibility Scoring
Evaluate the plausibility of the idea based on current off-the-shelf AI tools, cloud services, and engineering practices.
Assign a "feasibility_score" from 0–100:
0–30: Not technically feasible (speculative or unproven tech)
31–70: Partially feasible (requires custom R&D or complex engineering)
71–100: Technically feasible (can be implemented today)
Categorization
Choose a broad "idea_category" such as: Education, Finance, Health, Environment, Governance, Logistics, Media, Agriculture, etc.
Choose a specific "idea_cluster" (subdomain), such as: AI Tutoring, Fraud Detection, Wildfire Prevention, Precision Farming, Clinical Diagnostics, etc.
Similarity Scoring (within same cluster)
Given the list existing ideas, where each idea includes:
{
"idea_id": "<string>",
"idea_text": "<string>",
"embedding": [<float>, ...],
"cluster_id": <integer>
}
Perform the following:
Filter to only ideas with the same cluster_id as the new idea.
For each, calculate cosine similarity with the new idea embedding:
similarity = dot(A, B) / (norm(A) * norm(B))​
Convert similarity score to 0–100 scale.
Return only the single most similar idea, each in this format:
{
 "most_similar_idea": {
  "idea_id": "<string>",
  "similarity_score": <float>,
  "idea_text": "<string>"
 }
}
FINAL OUTPUT FORMAT
Return only valid JSON without any other text:
{
"feasibility_score": <integer>,
"idea_category": "<string>",
"idea_cluster": "<string>",
"cluster_id": <integer>,
"embedding": [<float>, <float>, ...],
"most_similar_idea": {
"idea_id": "<string>",
"similarity_score": <float>,
"idea_text": "<string>"
},
}
INPUTS
{
 "new_idea": "An AI assistant that monitors customer support chat logs in real-time and suggests relevant knowledge base articles to agents during the conversation.",
 "existing_ideas": [
  {
   "idea_id": "idea_001",
   "idea_text": "An AI system that classifies incoming customer emails and routes them to the correct department.",
   "embedding": [0.12, -0.05, 0.33, 0.10, 0.47, 0.02, 0.01, 0.44, 0.11, 0.08],
   "cluster_id": 2
  },
  {
   "idea_id": "idea_002",
   "idea_text": "A chatbot that helps users troubleshoot their Wi-Fi connection by asking guided diagnostic questions.",
   "embedding": [0.11, -0.02, 0.29, 0.15, 0.44, 0.09, 0.10, 0.33, 0.21, 0.07],
   "cluster_id": 2
  },
  {
   "idea_id": "idea_003",
   "idea_text": "An AI-powered resume screening tool that highlights qualified candidates based on job descriptions.",
   "embedding": [0.91, 0.75, -0.33, -0.22, 0.04, 0.11, 0.13, 0.15, 0.18, 0.22],
   "cluster_id": 7
  }
 ]
}`;
const userInput = JSON.stringify({ new_idea, existing_ideas });

return callGemini(systemPrompt, userInput);
}
