export type StableKey = string & { StableKey: never };

type TFunction = (...args: unknown[]) => unknown;
const functionKeyMap = new WeakMap<TFunction, StableKey>();
const getStableKeyForFunction = (func: TFunction): StableKey => {
  if (functionKeyMap.has(func)) {
    return functionKeyMap.get(func) as StableKey;
  }

  const key = `fn-${Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}` as StableKey;
  functionKeyMap.set(func, key);
  return key;
};

/**
 * This recursively:
 *  - sorts the keys of the object (and nested objects)
 *  - sorts the values of arrays (and nested arrays)
 *  - generates random stable keys for functions (like react components)
 * This is useful for getting a stable key for an object that is used as a
 * key in a map.
 */
const stabilize = (value: Parameters<typeof JSON.stringify>[0]): unknown => {
  // Handle arrays
  if (Array.isArray(value)) {
    // For arrays, we need to:
    // 1. Stabilize each element (which could be nested arrays/objects)
    // 2. Sort the array based on the stabilized elements
    const stabilizedArray = value.map(stabilize);
    // Sort based on the stringified values of the stabilized elements
    return stabilizedArray.sort((a, b) => {
      const aStr = JSON.stringify(a);
      const bStr = JSON.stringify(b);
      return aStr.localeCompare(bStr);
    });
  }

  // Handle functions
  if (typeof value === 'function') {
    return getStableKeyForFunction(value);
  }

  // Handle objects (but not null)
  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value);
    const sortedKeys = keys.sort();
    return sortedKeys.reduce(
      (acc, key) => {
        acc[key] = stabilize(value[key]);
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }

  // Handle primitives and null
  return value;
};

const getStableKey = (obj: Parameters<typeof JSON.stringify>[0]) => {
  const stableObj = stabilize(obj);
  return JSON.stringify(stableObj);
};

export default getStableKey;
