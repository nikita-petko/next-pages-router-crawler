import { fetchFlag } from '../client';
import { isOverridesEnabled } from '../config/base';
import { getOverride } from '../config/overrides';
import type { TFlagContextOf, TFlagRegistry, TFlagValueOf, TFlag, TFlagContext } from '../types';

function isOverrideValue<T>(value: unknown, defaultValue: T): value is T {
  return typeof value === typeof defaultValue;
}

function resolveLocalFlag<T>(
  override: unknown,
  defaultValue: T,
  contextValue: number | undefined,
): PromiseLike<T> | null {
  if (isOverrideValue(override, defaultValue)) {
    return Promise.resolve(override);
  }

  return typeof contextValue === 'undefined' || contextValue > 0
    ? null
    : Promise.resolve(defaultValue);
}

export default function defineFlag<
  N extends Extract<keyof TFlagRegistry, string>,
  K extends Extract<keyof TFlagRegistry[N], string>,
>({
  namespace,
  name,
  defaultValue,
}: {
  namespace: N;
  name: K;
  defaultValue: TFlagValueOf<N, K>;
}): TFlag<TFlagValueOf<N, K>, TFlagContextOf<N, K>> {
  type T = TFlagValueOf<N, K>;

  // * NOTE(@zwang, 04/09/26): React's `use()` compares thenables by reference,
  // * so we must return the same cached instance to avoid the "uncached promise" warning.
  // * Cache invalidates when the flag's own override value changes or context changes.
  let cached: PromiseLike<T> | null = null;
  let cachedOverride: unknown;
  let cachedContextValue: unknown;

  const flag = (context?: TFlagContext): PromiseLike<T> => {
    // * NOTE(@zwang, 04/21/26): overrides are context-free — they apply regardless of context.
    const override = isOverridesEnabled() ? getOverride(namespace, name) : undefined;
    // * NOTE(@zwang, 04/24/26): context always has exactly one key, so the single value
    // * is sufficient as a cache identity.
    const contextValue = context ? Object.values(context).pop() : undefined;

    if (cached !== null && override === cachedOverride && contextValue === cachedContextValue) {
      return cached;
    }

    cachedOverride = override;
    cachedContextValue = contextValue;
    cached =
      resolveLocalFlag(override, defaultValue, contextValue) ??
      fetchFlag<T>(namespace, name, context).catch(() => defaultValue);
    return cached;
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- bridge runtime implementation to generated conditional flag type
  return flag as TFlag<TFlagValueOf<N, K>, TFlagContextOf<N, K>>;
}
