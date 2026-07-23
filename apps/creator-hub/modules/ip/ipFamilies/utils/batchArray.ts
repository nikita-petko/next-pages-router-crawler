export default function batchArray<T>(array: T[], size: number): T[][] {
  if (!Array.isArray(array)) {
    throw new TypeError('The first argument must be an array.');
  }
  if (typeof size !== 'number' || size <= 0) {
    throw new TypeError('The batch size must be a positive number.');
  }

  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
}
