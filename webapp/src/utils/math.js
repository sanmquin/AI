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

/**
 * Scales a 2D vector (e.g., an engagement center) so that it does not exceed a maximum radius,
 * while preserving its original direction. If the vector's length is smaller than maxDistance,
 * it is returned as-is.
 *
 * @param {number} x - The X coordinate of the vector.
 * @param {number} y - The Y coordinate of the vector.
 * @param {number} maxDistance - The maximum allowed distance from the origin.
 * @returns {number[]} The scaled [x, y] vector.
 */
export function scaleCenterToMaxDistance(x, y, maxDistance) {
  const distance = Math.sqrt(x * x + y * y);

  if (maxDistance > 0 && distance > maxDistance) {
    const scale = maxDistance / distance;
    return [x * scale, y * scale];
  }

  return [x, y];
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
