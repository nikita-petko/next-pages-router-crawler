/**
 * Evenly paritions an array into chunks under a maximum size.
 *
 * E.g., [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], maxSize = 4,
 * should return [[1, 2, 3, 4], [5, 6, 7], [8, 9, 10]].
 */
export function partition<T>(arr: T[], maxSize: number): T[][] {
  if (maxSize <= 0) {
    throw new Error('maxSize must be greater than 0');
  }

  if (arr.length === 0) {
    return [];
  }

  // Calculate the optimal number of chunks to distribute elements evenly
  const numChunks = Math.ceil(arr.length / maxSize);
  const baseChunkSize = Math.floor(arr.length / numChunks);
  const remainder = arr.length % numChunks;

  const chunks: T[][] = [];
  let currentIndex = 0;

  // Distribute elements evenly, handling remainder
  for (let i = 0; i < numChunks; i += 1) {
    const chunkSize = baseChunkSize + (i < remainder ? 1 : 0);
    chunks.push(arr.slice(currentIndex, currentIndex + chunkSize));
    currentIndex += chunkSize;
  }

  return chunks;
}

/**
 * Counts the number of items in an array that satisfy a predicate.
 *
 * @example
 * const count = countBy([1, 2, 3, 4, 5], (item) => item > 3);
 * // count is 2
 */
export function countBy<T>(arr: T[], predicate: (item: T) => boolean): number {
  return arr.reduce((total, item) => total + (predicate(item) ? 1 : 0), 0);
}
