export const shouldSkipFullPageEmailVerification = (
  adAccountId: string | null | undefined,
  isAdAccountAutoCreateEnabled: boolean,
): boolean => Boolean(adAccountId) || isAdAccountAutoCreateEnabled;
