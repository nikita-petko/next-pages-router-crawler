/**
 * Exact `errorMessage` strings from the experience-subscriptions API that we show verbatim
 * in the UI (they supersede translated `failureReason` copy). Add new entries only when
 * product/backend confirm the text is stable.
 */
export const EXPERIENCE_SUBSCRIPTION_VERBATIM_ERROR_MESSAGES: ReadonlySet<string> = new Set([
  'Fiat price changes are not currently supported. To change the price, switch to Robux currency type.',
]);

export function isExperienceSubscriptionVerbatimErrorMessage(
  message: string | null | undefined,
): message is string {
  const trimmed = message?.trim();
  return (
    trimmed !== undefined &&
    trimmed !== '' &&
    EXPERIENCE_SUBSCRIPTION_VERBATIM_ERROR_MESSAGES.has(trimmed)
  );
}
