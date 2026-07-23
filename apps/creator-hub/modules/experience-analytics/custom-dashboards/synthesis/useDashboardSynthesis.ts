import { useMemo, useState } from 'react';
import type { CustomDashboardConfig } from '../types';
import { stabilizeSynthesisResult } from './stabilizeSynthesis';
import {
  createSynthesisTileCache,
  synthesize,
  type SynthesizeOptions,
  type SynthesizeResult,
} from './synthesize';

type SynthesisCache = {
  readonly config: CustomDashboardConfig;
  readonly result: SynthesizeResult;
};

type SynthesisResultStabilizer = {
  readonly stabilize: (
    config: CustomDashboardConfig,
    freshResult: SynthesizeResult,
  ) => SynthesizeResult;
};

function createSynthesisResultStabilizer(): SynthesisResultStabilizer {
  let cache: SynthesisCache | null = null;

  return {
    stabilize(config, freshResult) {
      const result =
        cache === null
          ? freshResult
          : stabilizeSynthesisResult(cache.config, cache.result, config, freshResult);
      cache = { config, result };
      return result;
    },
  };
}

/**
 * Memoized wrapper around `synthesize()` with per-tile component identity
 * stabilization across config updates (e.g. removing one chart tile).
 */
export default function useDashboardSynthesis(
  config: CustomDashboardConfig,
  options?: SynthesizeOptions,
): SynthesizeResult {
  const [tileCache] = useState(createSynthesisTileCache);
  const [resultStabilizer] = useState(createSynthesisResultStabilizer);
  const optionsTileCache = options?.tileCache;
  const freshResult = useMemo(
    () =>
      synthesize(config, {
        tileCache: optionsTileCache ?? tileCache,
      }),
    [config, optionsTileCache, tileCache],
  );

  return useMemo(
    () => resultStabilizer.stabilize(config, freshResult),
    [config, freshResult, resultStabilizer],
  );
}
