import { VertexAI } from "@google-cloud/vertexai";

export async function getIdeaEmbedding(text) {
  const vertex = new VertexAI({
    project: process.env.GCP_PROJECT_ID,
    location: "us-central1"
  });

  // 1. You MUST get the model instance first
  const model = vertex.getGenerativeModel({
    model: "gemini-embedding-001"
  });

  try {
    // 2. The method embedContent exists on the MODEL instance
    const request = {
      content: {
        parts: [{ text: text }]
      },
      // Valid task types: 'RETRIEVAL_DOCUMENT', 'RETRIEVAL_QUERY', 'SEMANTIC_SIMILARITY'
      taskType: 'SEMANTIC_SIMILARITY', 
    };

    const response = await model.embedContent(request);

    // 3. Extract the embedding values
    const embeddings = response.embedding.values;

    return embeddings;

  } catch (error) {
    console.error("Vertex AI Error:", error);
    throw new Error("Failed to generate embedding with Gemini.");
  }
}