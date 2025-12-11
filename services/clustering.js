import fs from "fs";
import path from "path";

export function loadClusters() {
  const filePath = path.join(process.cwd(), "data", "cluster_centroids.json");
  return JSON.parse(fs.readFileSync(filePath, "utf8")).clusters;
}

function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function assignCluster(embedding, centroids) {
  let bestIndex = -1;
  let bestDistance = Infinity;

  centroids.forEach((centroid, index) => {
    const dist = euclideanDistance(embedding, centroid);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestIndex = index;
    }
  });

  return bestIndex;
}