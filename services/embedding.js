import { VertexAI } from "@google-cloud/vertexai";

const vertex = new VertexAI({
  project: process.env.GCP_PROJECT,
  location: "us-central1"
});

const embeddingModel = vertex.getGenerativeModel({
  model: "text-embedding-005"
});

export async function getIdeaEmbedding(text) {
  const resp = await embeddingModel.embedContent({
    content: text
  });

  return resp.embedding.values; // Array of floats (128 dims)
}
