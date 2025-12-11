import { VertexAI } from "@google-cloud/vertexai";

export async function getIdeaEmbedding(text) {
  const vertex = new VertexAI({
    project: process.env.GCP_PROJECT_ID,
    location: "us-central1"
  });

  const model = vertex.getGenerativeModel({
    model: "text-embedding-005"
  });

  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text }]
      }
    ]
  });

  // 🔥 Proper access based on new API
  const embeddings = response?.response?.candidates?.[0]?.content?.parts?.[0]?.embedding?.values;

  return embeddings;
}
