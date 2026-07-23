/**
 * Wall-clock abstraction so service implementations can be injected with a
 * deterministic clock in tests. Never read `Date.now()` directly from a
 * service body — always funnel through a `Clock`.
 *
 * The interface is intentionally `isoNow()`-only: ids are generated via
 * `crypto.randomUUID()` (see `createTileId.ts`) and don't need a clock, so
 * `Clock` is solely the "what timestamp do I stamp this mutation with"
 * primitive. A second method would be dead surface area today.
 */
export type Clock = {
  isoNow(): string;
};

export const systemClock: Clock = {
  isoNow: () => new Date().toISOString(),
};

/**
 * Manual clock for tests. Each `isoNow()` call returns the current wall time
 * and then advances the internal counter by `step` ms, so tight back-to-back
 * mutations still produce strictly-monotonic ISO strings (with `step > 0`)
 * and assertions on `updatedAt` ordering aren't flaky.
 */
export function createManualClock(startMs: number, step = 0): Clock {
  let current = startMs;
  return {
    isoNow: () => {
      const value = new Date(current).toISOString();
      current += step;
      return value;
    },
  };
}
