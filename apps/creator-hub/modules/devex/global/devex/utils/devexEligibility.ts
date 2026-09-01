import type { GetDevExInfoResponse } from '@modules/clients/economy';

/**
 * Suspension fields on GET /v1/developer-exchange/info.
 */
export type DevExCashoutInfoWithSuspension = GetDevExInfoResponse & {
  isDevExSuspended?: boolean;
  isAtRiskOfSuspension?: boolean;
  devExSuspensionEndTimeUtc?: Date | string | null;
};

const asSuspensionInfo = (cashoutInfo: GetDevExInfoResponse): DevExCashoutInfoWithSuspension =>
  cashoutInfo;

export const isDevExSuspended = (cashoutInfo: GetDevExInfoResponse): boolean =>
  asSuspensionInfo(cashoutInfo).isDevExSuspended === true;

export const isAtRiskOfSuspension = (cashoutInfo: GetDevExInfoResponse): boolean =>
  asSuspensionInfo(cashoutInfo).isAtRiskOfSuspension === true;

export const getDevExSuspensionEndTimeUtc = (
  cashoutInfo: GetDevExInfoResponse,
): Date | undefined => {
  const raw = asSuspensionInfo(cashoutInfo).devExSuspensionEndTimeUtc;
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (raw instanceof Date) {
    return raw;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const isCashOutBlockedBySuspension = (cashoutInfo: GetDevExInfoResponse): boolean =>
  isDevExSuspended(cashoutInfo) && !isAtRiskOfSuspension(cashoutInfo);

/** Unacknowledged at-risk nudge — AMP sets isDevExSuspended true until the nudge is acknowledged. */
export const shouldShowDevExAtRiskDialog = (cashoutInfo: GetDevExInfoResponse): boolean =>
  isAtRiskOfSuspension(cashoutInfo);

/** Timed/permanent suspension after the at-risk nudge is cleared. */
export const shouldShowDevExSuspensionDialog = (cashoutInfo: GetDevExInfoResponse): boolean =>
  isDevExSuspended(cashoutInfo) && !isAtRiskOfSuspension(cashoutInfo);

/** Clears at-risk nudge flags locally after dismiss while economy refetch catches up. */
export const applyAtRiskNudgeAcknowledged = (
  cashoutInfo: GetDevExInfoResponse,
): GetDevExInfoResponse => {
  if (!isAtRiskOfSuspension(cashoutInfo)) {
    return cashoutInfo;
  }

  return {
    ...cashoutInfo,
    isAtRiskOfSuspension: false,
    isDevExSuspended: false,
    canProceedToCashout: true,
  };
};
