import { callGemini } from "../../services/genai.service.js";
import { Pool } from 'pg';


// PostgreSQL connection config
const pool = new Pool({
  user: 'ai4p-user',
  host: '34.44.147.36',
  database: 'ai4p-db',
  password: '$21RJ}{)c?CD<D<i',
  //port: 5432,
  //ssl: true // if using Cloud SQL over public IP
});

// format idea parts into an idea_text
function formatIdeaRowAsObject(row) {
  // Construct the idea_text from the descriptive fields only
  const ideaTextObject = {
    "Idea Title": row.idea_title,
    "Problem Statement": row.problem_statement,
    "Proposed AI Solution": row.proposed_ai_solution,
    "Potential Impact": row.potential_impact,
    "Key Features/Functionality": row.key_features || [],
    "Technical Requirements (Optional)": row.technical_requirements || [],
    "Team (Optional)": row.team || "",
    "Keywords/Tags": row.keywords || []
  };

  return {
    idea_id: row.id,
    idea_text: JSON.stringify(ideaTextObject), // Don't escape quotes; let JSON.stringify handle that
    embedding: Array.isArray(row.embedding) ? row.embedding.slice(0, 128) : [],
    cluster_id: parseInt(row.cluster_id)
  };
}

// convert idea_text from json to js object
function parseIdeaText(ideaText) {
  try {
    const ideaObject = JSON.parse(ideaText);

    return {
      idea_title: ideaObject["Idea Title"] || "",
      problem_statement: ideaObject["Problem Statement"] || "",
      proposed_ai_solution: ideaObject["Proposed AI Solution"] || "",
      potential_impact: ideaObject["Potential Impact"] || "",
      key_features: ideaObject["Key Features/Functionality"] || [],
      technical_requirements: ideaObject["Technical Requirements (Optional)"] || [],
      team: ideaObject["Team (Optional)"] || "",
      keywords: ideaObject["Keywords/Tags"] || []
    };
  } catch (err) {
    console.error("Failed to parse idea_text:", err);
    throw new Error("Invalid idea_text format");
  }
}

// Add a new idea to the database and return only the inserted ID
async function insertNewIdea(parsedIdea, evaluationResults) {
  const {
    idea_title,
    problem_statement,
    proposed_ai_solution,
    potential_impact,
    key_features,
    technical_requirements,
    team,
    keywords
  } = parsedIdea;

  const {
    clarity_score,
    impact_score,
    ethical_score,
    feasibility_score,
    idea_category,
    idea_cluster,
    cluster_id,
    embedding
  } = evaluationResults;

  const created_at = new Date(); // Current timestamp
  const updated_at = new Date();

  const query = `
    INSERT INTO ideas (
      idea_title,
      problem_statement,
      proposed_ai_solution,
      potential_impact,
      key_features,
      technical_requirements,
      team,
      keywords,
      clarity_score,
      impact_score,
      ethical_score,
      feasibility_score,
      idea_category,
      idea_cluster,
      cluster_id,
      embedding,
      created_at,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
    )
    RETURNING id
  `;

  const values = [
    idea_title,
    problem_statement,
    proposed_ai_solution,
    potential_impact,
    key_features,
    technical_requirements,
    team,
    keywords,
    clarity_score,
    impact_score,
    ethical_score,
    feasibility_score,
    idea_category,
    idea_cluster,
    cluster_id,
    embedding
  ];

  try {
    const { rows } = await pool.query(query, values);
    return rows[0].id;
  } catch (err) {
    console.error("Failed to insert idea:", err);
    throw err;
  }
}


// Fetch existing ideas with only required fields
async function fetchExistingIdeas(limit = 50) {
  try {
    const { rows } = await pool.query(`
      SELECT id, idea_title, problem_statement, proposed_ai_solution,
      potential_impact, key_features, technical_requirements,
      team, keywords, embedding, cluster_id
      FROM ideas
      WHERE embedding IS NOT NULL AND cluster_id IS NOT NULL
      LIMIT $1
    `, [limit]);

    // Format the results as expected
    const existing_ideas = rows.map(formatIdeaRowAsObject);

    return existing_ideas;
  } catch (error) {
    console.error('Error fetching existing ideas:', error);
    throw error;
  }
}


export async function runCreativityAnalysis(new_idea) {
  const systemPrompt = `You are a senior AI solution architect. Given a new AI idea and a list of existing ideas, follow the steps below in order:
INPUT VALIDATION
Before proceeding with the steps below, ensure that the INPUTS conform to the following:
The "New Idea" must be a string.
The "Existing Ideas" must be a list of dictionaries. Each dictionary must contain the keys "idea_id" (string), "idea_text" (string), "embedding" (a list of floats), and "cluster_id" (integer).
The "embedding" must be a list of floats (fixed length exactly 128).
The "cluster_id" must be an integer.
Vector Embedding
Generate a fixed-length vector embedding for the user idea using the textembedding-gecko@001 model but **limit the output to 128 dimensions** (to reduce latency or timeout issues).
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
  const existing_ideas = await fetchExistingIdeas();
  const userInput = JSON.stringify({ new_idea, existing_ideas });

  return callGemini(systemPrompt, userInput);
}

export async function runTechnicalFeasibiltyAnalysis(new_idea) {
  const systemPrompt = `You are a senior AI solution architect. For each given idea, perform the following steps in order:
  Vector Embedding
  Generate a fixed-length vector embedding for the user idea text using the textembedding-gecko@001 model but **limit the output to 128 dimensions** (to reduce latency or timeout issues).  
  Include this as an array of floats under the key "embedding".
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
   "embedding": [0.02, -0.11, 0.34, …]
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
  Impact Scoring
  Assess the potential positive societal impact of the AI idea using the following scale:
  0–30: Low impact — very limited or unclear societal benefit
  31–70: Moderate impact — helpful in a focused or narrow area
  71–100: High impact — widespread, transformative, or highly aligned with public good
  Your response must be returned as valid JSON only, with no explanations or extra text.
  Format:
  {
   "impact_score": <integer 0–100>
  }
  Examples:
  Idea: “An AI tool that helps detect depression early in teenagers by analyzing voice and text patterns.”
  Output:
  {
   "impact_score": 85
  }
  Idea: “A model that generates fun fantasy characters based on your favorite snacks.”
  Output:
  {
   "impact_score": 22
  }
  Idea: " "
  Output:
  {
    "impact_score": 0
  },
  Idea: "Hello World",
  Output:
  {
    "impact_score": 0
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
  Ethical Risk Scoring
  Based on possible issues including bias, privacy invasion, explainability, dual-use risks, and potential harm to vulnerable groups, assign an ethical_score from 0–100:
  0–30: High ethical risk — serious concerns or likely harm
  31–70: Moderate ethical risk — concerns that need mitigation
  71–100: Low ethical risk — minimal ethical concerns
  Your response must be returned as valid JSON only, with no explanations or extra text.
  Format:
  {
   "ethical_score": <integer 0–100>
  }
  Examples:
  Idea: “AI-based hiring platform that scans facial expressions to assess honesty.”
  Output:
  {
   "ethical_score": 28
  }
  Idea: “A WhatsApp chatbot that educates women in rural areas about legal rights and access to legal aid.”
  Output:
  {
   "ethical_score": 92
  }
  Idea: " "
  Output:
  {
    "ethical_score": 0
  },
  Idea: "Hello World",
  Output:
  {
    "ethical_score": 0
  }
  Now assess this idea:  
  `;
  const userInput = JSON.stringify({ new_idea });

  return callGemini(systemPrompt, userInput);
}

export async function runClarityandCoherenceAnalysis(new_idea){
  const systemPrompt = `You are an expert evaluator in assessing the clarity and coherence of AI solution ideas. For each given idea, perform the following steps in order:
  Clarity Scoring
  Based on linguistic quality, grammar, completeness, and conceptual coherence, assign a clarity_score from 0–100:
  0–30: Poor (vague, incoherent, or grammatically flawed)
  31–70: Moderate (partially clear but may contain ambiguity or structure issues)
  71–100: High (clear, coherent, well-expressed)
  Your response must be returned as valid JSON only, with no explanations or extra text.
  Output format:
  {
   "clarity_score": <integer 0–100>
  }
  Examples:
  Idea: “An AI platform that connects farmers to real-time market prices and weather updates via voice interface in local languages.”
  Output:
  {
   "clarity_score": 92
  }
  Idea: “Helping people with mental things using AI or something that watches videos of them and gives feedback or talks.”
  Output:
  {
   "clarity_score": 38
  }
  Idea: “A blockchain-based AI system to prevent election fraud in local governance structures.”
  Output:
  {
   "clarity_score": 74
  }
  Idea: " "
  Output:
  {
    "clarity_score": 0
  },
  Idea: "Hello World",
  Output:
  {
    "clarity_score": 0
  }
  Now assess this idea:  
  `;
  const userInput = JSON.stringify({ new_idea });

  return callGemini(systemPrompt, userInput);
}

export async function runFullAIdeaEvaluation(new_idea) {
  try {
    const [
      clarity,
      impact,
      ethical,
      feasibility
    ] = await Promise.all([
      runClarityandCoherenceAnalysis(new_idea),
      runImpactAssessmentAnalysis(new_idea),
      runEthicalEvaluationAnalysis(new_idea),
      runTechnicalFeasibiltyAnalysis(new_idea)
    ]);

    // Merge all outputs into one JSON
    const evaluationResults = {
      ...clarity,
      ...impact,
      ...ethical,
      ...feasibility
    };

    const parsedIdea = parseIdeaTextToObject(new_idea); // This should return an object with keys like idea_title, proposed_ai_solution, etc.

    // 4. Insert into DB (returns inserted ID)
    const idea_id = await insertNewIdea(parsedIdea, evaluationResults);

    // 5. Return both evaluation + inserted idea_id
    return {
      idea_id,
      ...evaluationResults
    };

  } catch (err) {
    console.error('Error during full AI idea evaluation:', err);
    throw err;
  }
}


export async function runExtractIdeaAnalysis(docstext){
  const systemPrompt = ` You are an expert AI idea analyst. You will be given the full text of a document describing a proposed AI idea. Your task is to read and understand the document, then automatically extract and summarize its key AI‑specific elements into a structured JSON object.
  INSTRUCTIONS:
  1. Read the provided text in its entirety.
  2. Identify and extract exactly these fields—tailored for AI ideas:
     - Idea Title
     - Problem Statement
     - Proposed AI Solution
     - Potential Impact
     - Key Features
     - Technical Requirements
     - Team
     - Keywords
  3. If any field is missing, set it to an empty string ("") or empty list ([]) as appropriate.
  4. Do not include any additional commentary—output only the JSON object.
  OUTPUT FORMAT:
  Return exactly one JSON object matching this schema:
  \`\`\`json
  {
    "Idea Title": "<string>",
    "Problem Statement": "<string>",
    "Proposed AI Solution": "<string>",
    "Potential Impact": "<string>",
    "Key Features": ["<string>", …],
    "Technical Requirements": ["<string>", …],
    "Team": ["<string>", …],
    "Keywords": ["<string>", …]
  }
  \`\`\`  
  `

  const userInput = JSON.stringify({ document: docstext});
  return callGemini(systemPrompt, userInput);
}