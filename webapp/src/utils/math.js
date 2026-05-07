export function normalizeVector(vector, dimensions = null) {
  if (!vector || vector.length === 0) return vector;

  let subset = vector;
  if (dimensions && Array.isArray(dimensions)) {
    subset = dimensions.map(index => vector[index]);
  }

  let sumSquare = 0;
  for (let i = 0; i < subset.length; i++) {
    sumSquare += subset[i] * subset[i];
  }

  const norm = Math.sqrt(sumSquare);
  if (norm === 0) return subset;

  return subset.map(v => v / norm);
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
