import { VertexAI } from "@google-cloud/vertexai";

export async function getIdeaEmbedding(text) {
  // --- Model Configuration ---
  // The latest and recommended embedding model
  const EMBEDDING_MODEL_NAME = "gemini-embedding-001";
  
  // 1. Initialize Vertex AI
  const vertex = new VertexAI({
    project: process.env.GCP_PROJECT_ID,
    location: "us-central1"
  });

  try {
    // 2. Use the correct, dedicated API for embeddings: vertex.embedContent()
    const response = await vertex.embedContent({
      model: EMBEDDING_MODEL_NAME,
      content: text, // The string to be embedded
      config: {
        // RECOMMENDED: Specify the task type for optimal embedding quality.
        // Common types: RETRIEVAL_DOCUMENT, RETRIEVAL_QUERY, SEMANTIC_SIMILARITY
        taskType: "SEMANTIC_SIMILARITY", 
        // Optional: output_dimensionality: 768, // Use if you need a smaller vector (e.g., 768 or 1536)
      }
    });

    // 3. Simple and correct access to the embedding vector
    const embeddings = response.embedding.values;

    return embeddings;

  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding with Gemini.");
  }
}