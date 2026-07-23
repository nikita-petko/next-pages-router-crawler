const emptyArray: Array<unknown> = [];

export default function getEmptyArray<T>(): T[] {
  return emptyArray as T[];
}
