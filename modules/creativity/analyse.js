import { callGemini } from "../../services/genai.service.js";
import { pool } from "../../config/db.js";
import { json } from "express";

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
function parseIdeaTextToObject(ideaText) {
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

// Add a new fully fledged idea to the database and return only the inserted ID
// async function insertNewIdea(parsedIdea, challenge, evaluationResults, author_id) {
//   const {
//     idea_title,
//     problem_statement,
//     proposed_ai_solution,
//     potential_impact,
//     key_features,
//     technical_requirements,
//     team,
//     keywords,
//   } = parsedIdea;

//   const {
//     clarity_score,
//     impact_score,
//     ethical_score,
//     feasibility_score,
//     idea_category,
//     idea_cluster,
//     cluster_id,
//     embedding,
//   } = evaluationResults;

//   const created_at = new Date(); // Current timestamp
//   const updated_at = new Date();
//   const status = "Under Review";
//   const isdraft = "false";

//   const query = `
//     INSERT INTO ideas (
//       idea_title,
//       problem_statement,
//       proposed_ai_solution,
//       potential_impact,
//       key_features,
//       technical_requirements,
//       team,
//       keywords,
//       clarity_score,
//       impact_score,
//       ethical_score,
//       feasibility_score,
//       idea_category,
//       idea_cluster,
//       cluster_id,
//       embedding,
//       challenge,
//       author_id,
//       created_at,
//       updated_at,
//       status,
//       isdraft
//     )
//     VALUES (
//       $1, $2, $3, $4, $5, $6, $7, $8,
//       $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
//     )
//     RETURNING id
//   `;

//   const values = [
//     idea_title,
//     problem_statement,
//     proposed_ai_solution,
//     potential_impact,
//     key_features,
//     technical_requirements,
//     team,
//     keywords,
//     clarity_score,
//     impact_score,
//     ethical_score,
//     feasibility_score,
//     idea_category,
//     idea_cluster,
//     cluster_id,
//     embedding,
//     challenge,
//     author_id,
//     created_at,
//     updated_at,
//     status,
//     isdraft
//   ];

//   try {
//     const { rows } = await pool.query(query, values);
//     return rows[0].id;
//   } catch (err) {
//     console.error("Failed to insert idea:", err);
//     throw err;
//   }
// }

async function insertNewIdea(
  idea_id,
  parsedIdea,
  challenge,
  evaluationResults,
  author_id
) {
  const {
    idea_title,
    problem_statement,
    proposed_ai_solution,
    potential_impact,
    key_features,
    technical_requirements,
    team,
    keywords,
  } = parsedIdea;

  const {
    clarity_score,
    impact_score,
    ethical_score,
    feasibility_score,
    idea_category,
    idea_cluster,
    cluster_id,
    embedding,
  } = evaluationResults;

  if (!idea_id) {
    // Insert new idea
    const created_at = new Date();
    const updated_at = new Date();
    const status = "Under Review";
    const isdraft = "false";

    const insertQuery = `
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
        challenge,
        author_id,
        created_at,
        updated_at,
        status,
        isdraft
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      )
    `;

    const insertValues = [
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
      challenge,
      author_id,
      created_at,
      updated_at,
      status,
      isdraft,
    ];

    try {
      await pool.query(insertQuery, insertValues);
      return "success";
    } catch (err) {
      console.error("Failed to insert idea:", err.message);
      return "failed";
    }
  } else {
    // Update existing idea
    const updated_at = new Date();

    const updateQuery = `
      UPDATE ideas
      SET
        idea_title = $1,
        problem_statement = $2,
        proposed_ai_solution = $3,
        potential_impact = $4,
        key_features = $5,
        technical_requirements = $6,
        team = $7,
        keywords = $8,
        clarity_score = $9,
        impact_score = $10,
        ethical_score = $11,
        feasibility_score = $12,
        idea_category = $13,
        idea_cluster = $14,
        cluster_id = $15,
        embedding = $16,
        challenge = $17,
        author_id = $18,
        updated_at = $19
      WHERE id = $20
    `;

    const updateValues = [
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
      challenge,
      author_id,
      updated_at,
      idea_id,
    ];

    try {
      const result = await pool.query(updateQuery, updateValues);
      if (result.rowCount === 0) {
        return "success";
      }
      // Success, implicitly returns undefined
    } catch (err) {
      console.error("Failed to update idea:", err.message);
      return "failed";
    }
  }
}

// Add a new basic idea to the database
async function insertNewBasicIdea(new_idea, similarityResults) {
  const { feasibility_score, idea_category, idea_cluster, most_similar_idea } =
    similarityResults;
  const created_at = new Date(); // Current timestamp

  const query = `
  INSERT INTO basic_ideas (
    idea,
    feasibility_score,
    idea_category,
    idea_cluster,
    most_similar_idea,
    created_at
  )
  VALUES (
    $1, $2, $3, $4, $5, $6
  )
  RETURNING id
  `;

  const values = [
    new_idea,
    feasibility_score,
    idea_category,
    idea_cluster,
    most_similar_idea?.idea_id || null,
    created_at,
  ];

  try {
    const { rows } = await pool.query(query, values);
    return {
      status: "success",
      idea_id: rows[0].id,
    };
  } catch (error) {
    console.error("Error inserting basic idea:", error);
    return {
      status: "error",
      message: "Database insert failed",
      details: error.message,
    };
  }
}

// Fetch existing ideas with only required fields for creativity analysis
async function fetchExistingIdeas() {
  try {
    const { rows } = await pool.query(`
      SELECT id, idea_title, problem_statement, proposed_ai_solution,
      potential_impact, key_features, technical_requirements,
      team, keywords, embedding, cluster_id
      FROM ideas
      WHERE embedding IS NOT NULL AND cluster_id IS NOT NULL
    `);

    // Format the results as expected
    const existing_ideas = rows.map(formatIdeaRowAsObject);

    return existing_ideas;
  } catch (error) {
    console.error("Error fetching existing ideas:", error);
    throw error;
  }
}

// Fetch existing ideas with these fields (id, embedding, cluster_id, feasibility_score, idea_category, idea_cluster, impact_score, ethical_score, clarity_score) for stack ranking based on challenge as a parameter
async function fetchExistingIdeasForStackRanking(challenge) {
  try {
    const { rows } = await pool.query(
      `
      SELECT id, embedding, cluster_id, feasibility_score, idea_category,
      idea_cluster, impact_score, ethical_score, clarity_score
      FROM ideas
      WHERE embedding IS NOT NULL AND cluster_id IS NOT NULL
      AND challenge = $1
      ORDER BY created_at DESC
    `,
      [challenge]
    );

    // Format the results as expected
    const existing_ideas = rows.map((row) => ({
      id: row.id,
      embedding: row.embedding || [],
      cluster_id: row.cluster_id,
      feasibility_score: row.feasibility_score,
      idea_category: row.idea_category,
      idea_cluster: row.idea_cluster,
      impact_score: row.impact_score,
      ethical_score: row.ethical_score,
      clarity_score: row.clarity_score,
    }));

    return existing_ideas;
  } catch (error) {
    console.error("Error fetching existing ideas for stack ranking:", error);
    throw error;
  }
}

// Update existing ideas with a new rank field (integer), runStackRanking will output an array of objects with id and rank, we'll loop through the array and update each idea in the database
export async function updateIdeaRanks(ideasWithRanks) {
  try {
    const updateQueries = ideasWithRanks.map((idea) => {
      return pool.query(`UPDATE ideas SET rank = $1 WHERE id = $2`, [
        idea.rank,
        idea.id,
      ]);
    });

    // Execute all update queries in parallel
    await Promise.all(updateQueries);
    return { status: "success", message: "Ranks updated successfully." };
  } catch (error) {
    console.error("Error updating idea ranks:", error);
    return {
      status: "error",
      message: "Failed to update ranks.",
      details: error.message,
    };
  }
}

export async function StackRanking(challenge) {
  const systemPrompt = `You are IdeaRankerGPT, a senior AI solution architect specialized in prioritizing ideas. Given a batch of ideas, follow the steps below in order:

INPUT VALIDATION  
Before proceeding, ensure that the inputs conform to the following:  
- The input is a JSON array.  
- Each element in the array is an object containing exactly these keys:  
  - "id" (string)  
  - "cluster_id" (integer from 0 to k‑1)  
  - "idea_category" (string)  
  - "idea_cluster" (string)  
  - "embedding" (array of numbers, length exactly 128)  
  - "feasibility_score" (number 0–100)  
  - "clarity_score" (number 0–100)  
  - "impact_score" (number 0–100)  
  - "ethical_score" (number 0–100)  

If validation fails, return a JSON object with "error" and a descriptive message.

NORMALIZATION  
For each cluster (grouped by "cluster_id"), normalize the four numeric scores (feasibility_score, clarity_score, impact_score, ethics_score) to a 0–1 scale using min‑max normalization within that cluster.

COMPOSITE SCORE COMPUTATION  
Compute a weighted composite score for each idea as follows:  

composite_score = (
  feasibility_score_norm * 0.20 +
  clarity_score_norm    * 0.10 +
  impact_score_norm     * 0.40 +
  ethical_score_norm     * 0.30
) * 10

Round to the nearest whole number and must be betwwen 1 and 10.

SORTING  
Sort the list of ideas in descending order of composite_score, whch will be the rank.

FINAL OUTPUT FORMAT  
Return **only** valid JSON (no commentary) in this exact structure:  

[
  {
    "id": "<string>",
    "rank": <integer>     // 1 = highest composite_score, 2 = next, etc.
  },
  ...
]


Example Input:  

[
  {
    "id": "idea_001",
    "cluster_id": 0,
    "idea_category": "Health",
    "idea_cluster": "Telemedicine",
    "embedding": [0.12, -0.03, …],  
    "feasibility_score": 7,
    "clarity_score": 8,
    "impact_score": 9,
    "ethical_score": 8
  },
  {
    "id": "idea_002",
    "cluster_id": 1,
    "idea_category": "Education",
    "idea_cluster": "EdTech",
    "embedding": [0.05, 0.15, …],
    "feasibility_score": 6,
    "clarity_score": 7,
    "impact_score": 8,
    "ethical_score": 9
  }
]


Expected Output:  

[
  { "id": "idea_001", "rank": 1 },
  { "id": "idea_002", "rank": 2 }
]
`;
  const existing_ideas = await fetchExistingIdeasForStackRanking(challenge);
  const userInput = JSON.stringify({ existing_ideas });

  console.log(await callGemini(systemPrompt, userInput));
  return await callGemini(systemPrompt, userInput);
}

export async function runCreativityAnalysis(new_idea) {
  const systemPrompt = `You are a senior AI solution architect with years of experience. Given a new AI idea and a list of existing ideas, follow these steps:

INPUT VALIDATION
- Verify "New Idea" is a string.
- Verify "Existing Ideas" is a list of dictionaries with keys: 
  "idea_id" (string), "idea_text" (string), "embedding" (128 floats), "cluster_id" (integer).

Vector Embedding
1. Generate a 128-dim embedding for the new idea using textembedding-gecko@001.

Cluster Assignment
2. Assign the new idea to the nearest cluster using the pre-trained K-Means model. 
   Output "cluster_id" (integer 0 to k-1).

Technical Feasibility Scoring
3. Assign "feasibility_score" (0-100):
   - 0-30: Not technically feasible
   - 31-70: Partially feasible
   - 71-100: Technically feasible

Categorization
4. Assign "idea_category" (e.g., Finance, Health).
5. Assign "idea_cluster" (e.g., Fraud Detection, Clinical Diagnostics).

Similarity Scoring
6. Filter existing ideas to the same cluster_id.
7. Remove duplicates: Exclude ideas with >95% text similarity (case-insensitive) to new idea.
8. For remaining ideas:
   a. Calculate cosine similarity: 𝑠𝑖𝑚=𝑑𝑜𝑡(𝐴,𝐵)/(‖𝐴‖‖𝐵‖)
   b. Convert to 0-100 scale: 𝑠𝑐𝑜𝑟𝑒=𝑟𝑜𝑢𝑛𝑑((𝑠𝑖𝑚+1)×50, 2)
9. If no ideas remain, return: 
   "most_similar_idea": null
10. Else, return the top match ONLY if its score ≥ 20. Otherwise, return null.

FINAL OUTPUT (JSON ONLY)
{
  "feasibility_score": <int>,
  "idea_category": "<string>",
  "idea_cluster": "<string>",
  "cluster_id": <int>,
  "most_similar_idea": {
    "idea_id": "<string> | null",
    "similarity_score": <float> | null, // 0-100
  }
}
  `;
  //"embedding": [<float>, ...], // 128 floats
  const existing_ideas = await fetchExistingIdeas();
  const userInput = JSON.stringify({ new_idea, existing_ideas });

  const response = await callGemini(systemPrompt, userInput);
  console.log(response);
  return response;
}

export async function runCreativityAnalysisandInsertIdea(new_idea) {
  try {
    // Step 1: Run creativity analysis to get similarity and metadata
    const similarityResults = await runCreativityAnalysis(new_idea);

    // Step 2: Insert into the database
    const result = await insertNewBasicIdea(new_idea, similarityResults);

    // return result; // { status: 'success', idea_id: '...' }
    return similarityResults;
  } catch (err) {
    console.error("Error in analyzeAndInsertNewIdea:", err);
    return {
      status: "error",
      message: "Failed to analyze or insert idea.",
      details: err.message,
    };
  }
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

export async function runImpactAssessmentAnalysis(new_idea) {
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

export async function runEthicalEvaluationAnalysis(new_idea) {
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

export async function runClarityandCoherenceAnalysis(new_idea) {
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

export async function runFullAIdeaEvaluation(
  new_idea,
  challenge,
  author_id,
  idea_id
) {
  try {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const clarity = await runClarityandCoherenceAnalysis(new_idea);
    await delay(200); // 500ms delay
    const impact = await runImpactAssessmentAnalysis(new_idea);
    await delay(200);
    const ethical = await runEthicalEvaluationAnalysis(new_idea);
    await delay(200);
    const feasibility = await runTechnicalFeasibiltyAnalysis(new_idea);

    // const [clarity, impact, ethical, feasibility] = await Promise.all([
    //   runClarityandCoherenceAnalysis(new_idea),
    //   runImpactAssessmentAnalysis(new_idea),
    //   runEthicalEvaluationAnalysis(new_idea),
    //   runTechnicalFeasibiltyAnalysis(new_idea),
    // ]);

    // Merge all outputs into one JSON
    const evaluationResults = {
      ...clarity,
      ...impact,
      ...ethical,
      ...feasibility,
    };

    const parsedIdea = parseIdeaTextToObject(new_idea); // This should return an object with keys like idea_title, proposed_ai_solution, etc.

    // 4. Insert into DB (returns inserted ID)
    await insertNewIdea(
      idea_id,
      parsedIdea,
      challenge,
      evaluationResults,
      author_id
    );
    return {
      status: "success",
      message: "Idea evaluated and inserted successfully.",
    };
  } catch (err) {
    console.error("Error during full AI idea evaluation:", err);
    //throw err;
    return {
      status: "error",
      message: "Something went wrong during idea evaluation or insertion.",
      error: err.message,
    };
  }
}

export async function runExtractIdeaAnalysis(docstext) {
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
  `;

  const userInput = JSON.stringify({ document: docstext });
  return callGemini(systemPrompt, userInput);
}

export async function runStackRanking(challenge) {
  try {
    const rankingResults = await StackRanking(challenge);
    if (rankingResults.error) {
      throw new Error(rankingResults.error);
    }
    await updateIdeaRanks(rankingResults);
    return {
      status: "success",
      message: "Stack ranking completed successfully.",
    };
  } catch (error) {
    console.error("Error in runStackRanking:", error);
    return {
      status: "error",
      message: "Failed to run stack ranking.",
      details: error.message,
    };
  }
}

// Deep Ideation endpoints

// full idea analysis
export async function runideaEvaluation(new_idea) {
  try {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const clarity = await runClarityandCoherenceAnalysis(new_idea);
    await delay(200); // 500ms delay
    const impact = await runImpactAssessmentAnalysis(new_idea);
    await delay(200);
    const ethical = await runEthicalEvaluationAnalysis(new_idea);
    await delay(200);
    const feasibility = await runTechnicalFeasibiltyAnalysis(new_idea);

    // Merge all outputs into one JSON
    const evaluationResults = {
      ...clarity,
      ...impact,
      ...ethical,
      ...feasibility,
    };

    // return evaluation results
    return {
      status: "success",
      results: evaluationResults,
    };
  } catch (error) {
    console.error("Error during full AI idea evaluation:", error);
    //throw err;
    return {
      status: "error",
      message: "Something went wrong during idea evaluation.",
      error: error.message,
    };
  }
}

// format idea parts into an idea_text
function formatIdeaAsObject(row) {
  // Construct the idea_text from the descriptive fields only
  const ideaTextObject = {
    "Idea Title": row.title,
    Content: row.content,
    "Problem Description": row.problem_description,
    "Proposed Solution": row.proposed_solution,
    "Potential Impact": row.potential_impact,
  };

  return {
    idea_id: row.id,
    idea_text: JSON.stringify(ideaTextObject), // Don't escape quotes; let JSON.stringify handle that
    embedding: Array.isArray(row.embedding) ? row.embedding.slice(0, 128) : [],
    cluster_id: parseInt(row.cluster_id),
  };
}

// Fetch existing ideas with only required fields for idea checker
async function fetchIdeas() {
  try {
    const { rows } = await pool.query(`
      SELECT id, title, content, challenge_name, goal_alignment, problem_description, proposed_solution, industries, technologies, embedding, cluster_id
      FROM deep_ideation.ideas
      WHERE embedding IS NOT NULL AND cluster_id IS NOT NULL
    `);

    // Format the results as expected
    const existing_ideas = rows.map(formatIdeaAsObject);

    return existing_ideas;
  } catch (error) {
    console.error("Error fetching existing ideas:", error);
    throw error;
  }
}

export async function runIdeaChecker(new_idea) {
  const systemPrompt = `You are a senior AI solution architect with years of experience. Given a new AI idea and a list of existing ideas, follow these steps:

INPUT VALIDATION
- Verify "New Idea" is a string.
- Verify "Existing Ideas" is a list of dictionaries with keys: 
  "idea_id" (string), "idea_text" (string), "embedding" (128 floats), "cluster_id" (integer).

Vector Embedding
1. Generate a 128-dim embedding for the new idea using textembedding-gecko@001.

Cluster Assignment
2. Assign the new idea to the nearest cluster using the pre-trained K-Means model. 
   Output "cluster_id" (integer 0 to k-1).

Technical Feasibility Scoring
3. Assign "feasibility_score" (0-100):
   - 0-30: Not technically feasible
   - 31-70: Partially feasible
   - 71-100: Technically feasible

Categorization
4. Assign "idea_category" (e.g., Finance, Health).
5. Assign "idea_cluster" (e.g., Fraud Detection, Clinical Diagnostics).

Similarity Scoring
6. Filter existing ideas to the same cluster_id.
7. Remove duplicates: Exclude ideas with >95% text similarity (case-insensitive) to new idea.
8. For remaining ideas:
   a. Calculate cosine similarity: 𝑠𝑖𝑚=𝑑𝑜𝑡(𝐴,𝐵)/(‖𝐴‖‖𝐵‖)
   b. Convert to 0-100 scale: 𝑠𝑐𝑜𝑟𝑒=𝑟𝑜𝑢𝑛𝑑((𝑠𝑖𝑚+1)×50, 2)
9. If no ideas remain, return: 
   "most_similar_idea": null
10. Else, return the top match ONLY if its score ≥ 20. Otherwise, return null.

FINAL OUTPUT (JSON ONLY)
{
  "feasibility_score": <int>,
  "idea_category": "<string>",
  "idea_cluster": "<string>",
  "cluster_id": <int>,
  "most_similar_idea": {
    "idea_id": "<string> | null",
    "similarity_score": <float> | null, // 0-100
  }
}
  `;

  const existing_ideas = await fetchIdeas();
  const userInput = JSON.stringify({ new_idea, existing_ideas });

  const response = await callGemini(systemPrompt, userInput);
  console.log(response);
  return response;
}

// script to update ideas

export async function runProcessIdeas() {
  try {
    console.log("Starting --->");

    const { rows } = await pool.query(`
      SELECT id, title, content, challenge_name, goal_alignment, 
             problem_description, proposed_solution, industries, technologies
      FROM deep_ideation.ideas
      WHERE title IS NOT NULL
      LIMIT 1
    `);

    // Build the idea text that will be sent to Gemini
    const ideaObject = {
      "Idea Title": rows.title ?? "",
      "Problem Statement": rows.problem_description ?? "",
      "Proposed AI Solution": rows.proposed_solution ?? "",
      "Content": rows.content ?? "",
    };

    const new_idea = JSON.stringify(ideaObject);

    const result = await runTechnicalFeasibiltyAnalysis(new_idea);
    console.log(result);
    return result;
    

    // console.log(`Found ${rows.length} ideas to process...`);

    // const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // for (const row of rows) {
    //   console.log(`Processing ID ${row.id} ...`);

    //   // Build the idea text that will be sent to Gemini
    //   const ideaObject = {
    //     "Idea Title": row.title ?? "",
    //     "Problem Statement": row.problem_description ?? "",
    //     "Proposed AI Solution": row.proposed_solution ?? "",
    //     "Content": row.content ?? "",
    //   };

    //   const new_idea = JSON.stringify(ideaObject);

    //   // ---- RUN ANALYSES SAFELY ----
    //   let clarity, impact, ethical, feasibility;

    //   try {
    //     clarity = await runClarityandCoherenceAnalysis(new_idea);
    //   } catch (e) {
    //     console.error("Clarity analysis failed:", e);
    //     continue;
    //   }

    //   await delay(200);

    //   try {
    //     impact = await runImpactAssessmentAnalysis(new_idea);
    //   } catch (e) {
    //     console.error("Impact analysis failed:", e);
    //     continue;
    //   }

    //   await delay(200);

    //   try {
    //     ethical = await runEthicalEvaluationAnalysis(new_idea);
    //   } catch (e) {
    //     console.error("Ethical analysis failed:", e);
    //     continue;
    //   }

    //   await delay(200);

    //   try {
    //     feasibility = await runTechnicalFeasibiltyAnalysis(new_idea);
    //     console.log(feasibility);
    //   } catch (e) {
    //     console.error("Feasibility analysis failed:", e);
    //     continue;
    //   }

    
    //   //---- COMBINE RESULTS ----
    //   const evaluationResults = {
    //     ...clarity,
    //     ...impact,
    //     ...ethical,
    //     ...feasibility,
    //   };

    //   //console.log("Merged results:", evaluationResults);

    //   // ---- SQL UPDATE (optional, commented out) ----
    //   // await pool.query(`
    //   //   UPDATE deep_ideation.ideas
    //   //   SET evaluation = $1::jsonb
    //   //   WHERE id = $2
    //   // `, [evaluationResults, row.id]);

    //   console.log(`✔ Completed row ${row.id}`);
    // }

    // console.log("🎉 Processing complete!");
    // return "Processing complete!";

  } catch (err) {
    console.error("Fatal Error:", err);
    return "Fatal error";

  } finally {
    pool.end();
  }
}
