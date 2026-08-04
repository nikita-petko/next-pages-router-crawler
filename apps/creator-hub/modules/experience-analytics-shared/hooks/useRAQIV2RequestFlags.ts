import { useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { isAceRankBreakdownSpecEnabled } from '@generated/flags/creatorAnalytics';
import type { MakeRAQIV2RequestOptions } from '../utils/makeRAQIV2Request';

export type RAQIV2RequestFlagValues = Required<
  Pick<MakeRAQIV2RequestOptions, 'emitAceRankBreakdownSpec'>
>;

/**
 * Flag values are readable only once every flag has resolved. Modeling this as a
 * union rather than `{ ready: boolean } & values` means a consumer cannot read a
 * provisional `false` without first checking `ready` — the compiler enforces the
 * gate that previously existed only by convention.
 */
export type RAQIV2RequestFlags = ({ ready: true } & RAQIV2RequestFlagValues) | { ready: false };

/**
 * Resolves request-level rollout flags through the React flag runtime so
 * request execution never evaluates flags directly. `ready` lets request hooks
 * defer execution instead of sending requests with provisional values.
 */
const useRAQIV2RequestFlags = (): RAQIV2RequestFlags => {
  const aceRankBreakdownSpec = useFlag(isAceRankBreakdownSpecEnabled);
  const ready = aceRankBreakdownSpec.ready;
  const emitAceRankBreakdownSpec = aceRankBreakdownSpec.ready && aceRankBreakdownSpec.value;

  return useMemo(
    (): RAQIV2RequestFlags => (ready ? { ready, emitAceRankBreakdownSpec } : { ready }),
    [ready, emitAceRankBreakdownSpec],
  );
};

export default useRAQIV2RequestFlags;
