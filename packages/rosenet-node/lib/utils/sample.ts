/**
 * Sample `size` elements from `array` randomly
 * @param array
 * @param size
 */
const sample = <T>(array: T[], size: number): T[] =>
  array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
    .slice(0, size);

export default sample;
