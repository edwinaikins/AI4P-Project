import { callGemini } from "../../services/genai.service.js";

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
`;
  const userInput = JSON.stringify({ new_idea, existing_ideas });

  return callGemini(systemPrompt, userInput);
}

export async function runTechnicalFeasibiltyAnalysis(new_idea) {
  const systemPrompt = `You are a senior AI solution architect. For each given idea, perform the following steps in order:
  Vector Embedding
  Generate a fixed-length vector embedding for the idea text using the textembedding-gecko@001 model.  
  Include this embedding (an array of floats) in your output under the key "embedding".
  Cluster Assignment 
  Using a pre-trained K-Means model with k clusters (centroids provided separately), assign the idea’s embedding to its nearest cluster.  
  Record that as an integer cluster_id (0 through k-1).
  Technical Feasibility Scoring
  Based on current off-the-shelf AI tools, cloud services, and engineering practices, evaluate the plausibility of the proposed AI solution and assign a “feasibility_score” from 0–100:  
  0–30: Not technically feasible (speculative, unproven tech)  
  31–70: Partially feasible (requires R&D or custom engineering)  
  71–100: Technically feasible (implementable today)  
  Categorization
  Choose a broad “idea_category” (e.g., Education, Health, Finance, Agriculture, Environment, Governance, etc.).  
  Choose a specific “idea_cluster” (subdomain) aligned with that category (e.g., AI Tutoring, Precision Farming, Fraud Detection, Climate Modeling, Election Monitoring, etc.).
  Your response must be returned as **valid JSON only**, with no explanations or extra text.
  Output format:
  {
   "feasibility_score": <integer 0–100>,
   "idea_category": "<string>",
   "idea_cluster": "<string>",
   "cluster_id": <integer>,
   "embedding": [<float>, <float>, …]
  }
  Examples:
  Idea: “A drone fleet that uses onboard computer vision to detect and extinguish wildfires before they spread.”
  Output:
  {
   "feasibility_score": 72,
   "idea_category": "Environment",
   "idea_cluster": "Wildfire Prevention",
   "cluster_id": 3,
   "embedding": [0.023, -0.112, 0.345, …]
  }
  Idea: “AI that implants ideas into people’s dreams to influence behavior.”
  Output:
  {
   "feasibility_score": 12,
   "idea_category": "General AI",
   "idea_cluster": "Speculative Concepts",
   "cluster_id": 7,
   "embedding": [0.512, -0.301, 0.047, …]
  }
  Idea: " "
  Output:
  {
    "feasibility_score": 0,
    "idea_category": "n/a",
    "idea_cluster": "n/a",
    cluster_id: ,
    embedding": []
  },
  Idea: "Hello World",
  Output:
  {
    "feasibility_score": 0,
    "idea_category": "n/a",
    "idea_cluster": "n/a",
    "cluster_id": ,
    "embedding": []
  }
  Now evaluate this new idea:
  `;
  const userInput = JSON.stringify({ new_idea });

  return callGemini(systemPrompt, userInput);
}

export async function runImpactAssessmentAnalysis(new_idea){
  const systemPrompt = `You are an expert in evaluating the potential impact of AI projects.
  Your job is to analyze the idea and assess **how significant and positive its impact could be** if implemented. Focus on potential improvements to human life, social systems, the environment, or peace-building.
  For each given idea, perform the following steps in order:  
  Vector Embedding
  Generate a fixed-length vector embedding for the idea text using the textembedding-gecko@001 model.
  Include this embedding (an array of floats) in your output under the key "embedding".
  Cluster Assignment
  Using a pre-trained K-Means model with k clusters (centroids provided separately), assign the idea’s embedding to its nearest cluster.
  Record that as an integer cluster_id (0 through k-1).
  Impact Scoring
  Assess the potential positive societal impact of the AI idea using the following scale:
  0–30: Low impact — very limited or unclear societal benefit
  31–70: Moderate impact — helpful in a focused or narrow area
  71–100: High impact — widespread, transformative, or highly aligned with public good
  Categorization
  Choose a broad "idea_category" (e.g., Education, Health, Finance, Environment, Governance, etc.)
  Choose a specific "idea_cluster" (e.g., AI Tutoring, Climate Monitoring, Civic Tech, Market Access, etc.)
  Your response must be returned as valid JSON only, with no explanations or extra text.
  Format:
  {
   "impact_score": <integer 0–100>,
   "idea_category": "<string>",
   "idea_cluster": "<string>",
   "cluster_id": <integer>,
   "embedding": [<float>, <float>, …]
  }
  Examples:
  Idea: “An AI tool that helps detect depression early in teenagers by analyzing voice and text patterns.”
  Output:
  {
   "impact_score": 85,
   "idea_category": "Health",
   "idea_cluster": "Mental Health Support",
   "cluster_id": 2,
   "embedding": [0.201, -0.152, 0.491, …]
  }
  Idea: “A model that generates fun fantasy characters based on your favorite snacks.”
  Output:
  {
   "impact_score": 22,
   "idea_category": "Entertainment",
   "idea_cluster": "Generative Content",
   "cluster_id": 9,
   "embedding": [-0.045, 0.320, 0.212, …]
  }
  Idea: " "
  Output:
  {
    "feasibility_score": 0,
    "idea_category": "n/a",
    "idea_cluster": "n/a",
    cluster_id: ,
    embedding": []
  },
  Idea: "Hello World",
  Output:
  {
    "feasibility_score": 0,
    "idea_category": "n/a",
    "idea_cluster": "n/a",
    "cluster_id": ,
    "embedding": []
  }
  Now evaluate this new idea:
  `;
  const userInput = JSON.stringify({ new_idea });

  return callGemini(systemPrompt, userInput);
}

export async function runEthicalEvaluationAnalysis(new_idea){
  const systemPrompt = `You are an AI ethics advisor assessing the ethical risks of proposed AI projects.
  Your job is to identify the **presence of potential ethical concerns**, such as:
  Bias or discrimination
  Privacy invasion
  Misuse or dual-use risk
  Lack of transparency or explainability
  Harm to vulnerable groups
  For each given idea, perform the following steps in order:
  Vector Embedding
  Generate a fixed-length vector embedding for the idea text using the textembedding-gecko@001 model.
  Include this embedding (an array of floats) in your output under the key "embedding".
  Cluster Assignment
  Using a pre-trained K-Means model with k clusters (centroids provided separately), assign the idea’s embedding to its nearest cluster.
  Record that as an integer cluster_id (0 through k-1).
  Ethical Risk Scoring
  Based on possible issues including bias, privacy invasion, explainability, dual-use risks, and potential harm to vulnerable groups, assign an ethical_score from 0–100:
  0–30: High ethical risk — serious concerns or likely harm
  31–70: Moderate ethical risk — concerns that need mitigation
  71–100: Low ethical risk — minimal ethical concerns
  Categorization
  Choose a broad "idea_category" (e.g., Education, Health, Finance, Governance, etc.)
  Choose a specific "idea_cluster" (e.g., Fraud Detection, Digital Identity, AI Tutoring, Surveillance Tech, etc.)
  Your response must be returned as valid JSON only, with no explanations or extra text.
  Format:
  {
   "ethical_score": <integer 0–100>,
   "idea_category": "<string>",
   "idea_cluster": "<string>",
   "cluster_id": <integer>,
   "embedding": [<float>, <float>, …]
  }
  Examples:
  Idea: “AI-based hiring platform that scans facial expressions to assess honesty.”
  Output:
  {
   "ethical_score": 28,
   "idea_category": "Employment",
   "idea_cluster": "AI Recruitment",
   "cluster_id": 4,
   "embedding": [0.128, -0.443, 0.291, …]
  }
  Idea: “A WhatsApp chatbot that educates women in rural areas about legal rights and access to legal aid.”
  Output:
  {
   "ethical_score": 92,
   "idea_category": "Governance",
   "idea_cluster": "Legal Access",
   "cluster_id": 1,
   "embedding": [0.219, -0.098, 0.415, …]
  }
  Idea: " "
  Output:
  {
    "feasibility_score": 0,
    "idea_category": "n/a",
    "idea_cluster": "n/a",
    cluster_id: ,
    embedding": []
  },
  Idea: "Hello World",
  Output:
  {
    "feasibility_score": 0,
    "idea_category": "n/a",
    "idea_cluster": "n/a",
    "cluster_id": ,
    "embedding": []
  }
  Now assess this idea:  
  `;
  const userInput = JSON.stringify({ new_idea });

  return callGemini(systemPrompt, userInput);
}

export async function runClarityandCoherenceAnalysis(new_idea){
  const systemPrompt = `You are an expert evaluator in assessing the clarity and coherence of AI solution ideas. For each given idea, perform the following steps in order:
  Vector Embedding
  Generate a fixed-length vector embedding for the idea text using the textembedding-gecko@001 model.
  Include this embedding (an array of floats) in your output under the key "embedding".
  Cluster Assignment
  Using a pre-trained K-Means model with k clusters (centroids provided separately), assign the idea’s embedding to its nearest cluster.
  Record that as an integer cluster_id (0 through k-1).
  Clarity Scoring
  Based on linguistic quality, grammar, completeness, and conceptual coherence, assign a clarity_score from 0–100:
  0–30: Poor (vague, incoherent, or grammatically flawed)
  31–70: Moderate (partially clear but may contain ambiguity or structure issues)
  71–100: High (clear, coherent, well-expressed)
  Categorization
  Choose a broad "idea_category" (e.g., Education, Health, Finance, Agriculture, Environment, Governance, etc.)
  Choose a specific "idea_cluster" (e.g., AI Tutoring, Precision Farming, Fraud Detection, Climate Modeling, Election Monitoring, etc.)
  Your response must be returned as valid JSON only, with no explanations or extra text.
  Output format:
  {
   "clarity_score": <integer 0–100>,
   "idea_category": "<string>",
   "idea_cluster": "<string>",
   "cluster_id": <integer>,
   "embedding": [<float>, <float>, …]
  }
  Examples:
  Idea: “An AI platform that connects farmers to real-time market prices and weather updates via voice interface in local languages.”
  Output:
  {
   "clarity_score": 92,
   "idea_category": "Agriculture",
   "idea_cluster": "Market Access & Climate Advisory",
   "cluster_id": 3,
   "embedding": [0.023, -0.112, 0.345, …]
  }
  Idea: “Helping people with mental things using AI or something that watches videos of them and gives feedback or talks.”
  Output:
  {
   "clarity_score": 38,
   "idea_category": "Health",
   "idea_cluster": "Mental Health Support",
   "cluster_id": 7,
   "embedding": [0.512, -0.301, 0.047, …]
  }
  Idea: “A blockchain-based AI system to prevent election fraud in local governance structures.”
  Output:
  {
   "clarity_score": 74,
   "idea_category": "Governance",
   "idea_cluster": "Election Monitoring",
   "cluster_id": 2,
   "embedding": [0.132, -0.087, 0.264, …]
  }
  Idea: " "
  Output:
  {
    "feasibility_score": 0,
    "idea_category": "n/a",
    "idea_cluster": "n/a",
    cluster_id: ,
    embedding": []
  },
  Idea: "Hello World",
  Output:
  {
    "feasibility_score": 0,
    "idea_category": "n/a",
    "idea_cluster": "n/a",
    "cluster_id": ,
    "embedding": []
  }
  Now assess this idea:  
  `;
  const userInput = JSON.stringify({ new_idea });

  return callGemini(systemPrompt, userInput);
}