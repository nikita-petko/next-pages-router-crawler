import { useEffect, useMemo, useState } from 'react';

/**
 * Foundation Tailwind breakpoint floors (px). Each `isX` flag in the return
 * value is `true` when the viewport is **at or above** that threshold — the
 * same semantics as the `small:`, `medium:`, `large:`, etc. Tailwind prefixes
 * shipped by `@rbx/foundation-tailwind`.
 *
 * Source of truth: `@rbx/foundation-tailwind`'s generated config. Mirroring
 * the numbers here avoids pulling the Tailwind config into the runtime
 * bundle and keeps the hook usable from anywhere (modules, hooks, services).
 */
const BREAKPOINTS = {
  large: 1141,
  medium: 601,
  small: 361,
  xlarge: 1521,
  xxlarge: 1921,
} as const;

interface MediaQueryResult {
  isLarge: boolean;
  isMedium: boolean;
  isSmall: boolean;
  isXLarge: boolean;
  isXXLarge: boolean;
}

const DEFAULT_RESULT: MediaQueryResult = {
  isLarge: false,
  isMedium: false,
  isSmall: false,
  isXLarge: false,
  isXXLarge: false,
};

const buildQuery = (minWidth: number): string => `(min-width: ${minWidth}px)`;

/**
 * Returns the full set of Foundation breakpoint flags for the current
 * viewport. Each flag means "viewport width is ≥ that breakpoint", matching
 * Tailwind's mobile-first prefix semantics.
 *
 * Pattern mirrors `web-frontend`'s `useMediaQuery` so behavior stays
 * consistent across Roblox web surfaces. SSR-safe: on the server, all flags
 * are `false` (smallest layout). The effect upgrades to real values after
 * hydration.
 *
 * @example
 * ```ts
 * const { isLarge, isMedium } = useMediaQuery();
 * const size = isLarge ? 'Large' : isMedium ? 'Medium' : 'Small';
 * ```
 */
const useMediaQuery = (): MediaQueryResult => {
  // `window.matchMedia` is browser-only. On SSR we return `null` here and
  // surface DEFAULT_RESULT from `useState` below; the effect short-circuits
  // and the client hydrates with real values on mount.
  const queries = useMemo(
    () =>
      typeof window === 'undefined'
        ? null
        : {
            large: window.matchMedia(buildQuery(BREAKPOINTS.large)),
            medium: window.matchMedia(buildQuery(BREAKPOINTS.medium)),
            small: window.matchMedia(buildQuery(BREAKPOINTS.small)),
            xlarge: window.matchMedia(buildQuery(BREAKPOINTS.xlarge)),
            xxlarge: window.matchMedia(buildQuery(BREAKPOINTS.xxlarge)),
          },
    [],
  );

  // Lazy initializer reads `.matches` exactly once at first render. This
  // avoids a `setState` cascade inside `useEffect` (which would trigger the
  // `react-hooks/set-state-in-effect` lint and add a wasted render).
  const [result, setResult] = useState<MediaQueryResult>(() => {
    if (queries === null) {
      return DEFAULT_RESULT;
    }
    return {
      isLarge: queries.large.matches,
      isMedium: queries.medium.matches,
      isSmall: queries.small.matches,
      isXLarge: queries.xlarge.matches,
      isXXLarge: queries.xxlarge.matches,
    };
  });

  useEffect(() => {
    if (queries === null) {
      return undefined;
    }
    const update = (): void => {
      setResult({
        isLarge: queries.large.matches,
        isMedium: queries.medium.matches,
        isSmall: queries.small.matches,
        isXLarge: queries.xlarge.matches,
        isXXLarge: queries.xxlarge.matches,
      });
    };
    const lists = Object.values(queries);
    lists.forEach((mql) => mql.addEventListener('change', update));
    return () => {
      lists.forEach((mql) => mql.removeEventListener('change', update));
    };
  }, [queries]);

  return result;
};

export default useMediaQuery;
