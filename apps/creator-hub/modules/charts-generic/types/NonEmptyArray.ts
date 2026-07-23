export type NonEmptyArray<T> = [T, ...T[]];
export const isNonEmptyArray = <T>(arr?: T[]): arr is NonEmptyArray<T> => !!arr && arr.length > 0;

export const mapNonEmptyArray = <T, U>(
  arr: NonEmptyArray<T>,
  fn: (item: T, index: number) => U,
): NonEmptyArray<U> => {
  return arr.map(fn) as NonEmptyArray<U>;
};

export const flatMapNonEmptyArray = <T, U>(
  arr: NonEmptyArray<T>,
  fn: (item: T, index: number) => U[],
): NonEmptyArray<U> => {
  return arr.flatMap(fn) as NonEmptyArray<U>;
};
