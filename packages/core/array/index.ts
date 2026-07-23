/**
 * example: range(4, 20, 1);
 * result: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
 * @param start
 * @param end
 * @param step
 */
export function range(start: number, end: number, step = 1): Array<number> {
  const len = Math.floor((end - start) / step) + 1;
  return Array(len)
    .fill(0)
    .map((_, idx) => start + idx * step);
}

export default {
  range,
};
