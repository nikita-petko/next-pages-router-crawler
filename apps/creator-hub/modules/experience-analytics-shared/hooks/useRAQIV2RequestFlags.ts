import { useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { isAceMetricVariantFanoutEnabled } from '@generated/flags/creatorAnalytics';
import type { MakeRAQIV2RequestOptions } from '../utils/makeRAQIV2Request';

export type RAQIV2RequestFlags = Required<
  Pick<MakeRAQIV2RequestOptions, 'enableAceVariantFanout'>
> & {
  ready: boolean;
};

/**
 * Resolves request-level rollout flags through the React flag runtime so
 * request execution never evaluates flags directly. Effective values remain
 * false until their flag is ready, while `ready` lets request hooks defer
 * execution instead of sending requests with those provisional values.
 *
 * The ACE flag must not lead the backend `PseudoMetricResolutionEnabled`
 * rollout or AQG can return `ERROR_CODE_METRIC_NOT_RESOLVABLE`.
 */
const useRAQIV2RequestFlags = (): RAQIV2RequestFlags => {
  const aceVariantFanout = useFlag(isAceMetricVariantFanoutEnabled);
  const ready = aceVariantFanout.ready;
  const enableAceVariantFanout = aceVariantFanout.ready && aceVariantFanout.value;

  return useMemo(
    () => ({
      ready,
      enableAceVariantFanout,
    }),
    [ready, enableAceVariantFanout],
  );
};

export default useRAQIV2RequestFlags;
