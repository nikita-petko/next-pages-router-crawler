export const oneTimePayoutStatuses = ['NotHeld', 'Held', 'Denied'] as const;
export type OneTimePayoutStatus = (typeof oneTimePayoutStatuses)[number];

const oneTimePayoutStatusByEnumValue: Record<number, OneTimePayoutStatus> = {
  0: 'NotHeld',
  1: 'Held',
  2: 'Denied',
};

export const getOneTimePayoutStatus = (response: unknown): OneTimePayoutStatus | undefined => {
  if (!response || typeof response !== 'object') {
    return undefined;
  }

  const responseRecord = response as Record<string, unknown>;
  const status = responseRecord.status ?? responseRecord.Status;

  if (typeof status === 'string' && oneTimePayoutStatuses.includes(status as OneTimePayoutStatus)) {
    return status as OneTimePayoutStatus;
  }

  if (typeof status === 'number') {
    return oneTimePayoutStatusByEnumValue[status];
  }

  return undefined;
};
