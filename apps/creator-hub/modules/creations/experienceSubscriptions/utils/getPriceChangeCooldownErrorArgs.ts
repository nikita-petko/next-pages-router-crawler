import type { ErrorResponse } from '@rbx/client-developer-subscriptions-api/v1';

/**
 * Builds the interpolation arguments for the `Error.PriceChangeCooldown` translation
 * from the backend `ErrorResponse.details` map.
 *
 * The backend supplies the raw numbers (`lastChangeDays`, `cooldownDays`); the frontend
 * derives `daysRemaining = cooldownDays - lastChangeDays` so the localized message can
 * render "you can change it again in N days" without the backend hardcoding English.
 *
 * Returns `undefined` when the details are missing or non-numeric, so callers fall back
 * to the un-interpolated string.
 */
const getPriceChangeCooldownErrorArgs = (
  details: ErrorResponse['details'],
): { [key: string]: string } | undefined => {
  if (!details) {
    return undefined;
  }

  const lastChangeDays = Number(details.lastChangeDays);
  const cooldownDays = Number(details.cooldownDays);

  if (!Number.isFinite(lastChangeDays) || !Number.isFinite(cooldownDays)) {
    return undefined;
  }

  const daysRemaining = Math.max(0, cooldownDays - lastChangeDays);

  return {
    lastChangeDays: String(lastChangeDays),
    cooldownDays: String(cooldownDays),
    daysRemaining: String(daysRemaining),
  };
};

export default getPriceChangeCooldownErrorArgs;
