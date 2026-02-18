/**
 * Returns a random element from a non-empty array.
 * If the array is empty, returns undefined.
 */
export function pickRandom<T>(array: readonly T[]): T | undefined {
  if (array.length === 0) return undefined;
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}
