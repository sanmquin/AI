export function normalizeVector(vector) {
  if (!vector || vector.length === 0) return vector;

  let sumSquare = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSquare += vector[i] * vector[i];
  }

  const norm = Math.sqrt(sumSquare);
  if (norm === 0) return vector;

  return vector.map(v => v / norm);
}

export function euclideanDistance(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return Infinity;

  let sumSquare = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sumSquare += diff * diff;
  }

  return Math.sqrt(sumSquare);
}
