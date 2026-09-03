const ONE_MINUTE_IN_SECONDS = 60;
const ONE_HOUR_IN_SECONDS = 3600;
const ONE_DAY_IN_SECONDS = 86400;
const ONE_DAY_IN_MS = ONE_DAY_IN_SECONDS * 1000;

type TranslateFn = (key: string, params?: Record<string, string>) => string;

/**
 * Remaining-time label for the intervention details badge (e.g. "2 days left").
 */
export function formatInterventionCountdown(
  endDate: Date,
  translate: TranslateFn,
): string | undefined {
  const timeRemainingSecs = Math.max((endDate.getTime() - Date.now()) / 1000, 0);

  if (timeRemainingSecs <= 0) {
    return undefined;
  }

  const roundedUpMinutes = Math.ceil(timeRemainingSecs / ONE_MINUTE_IN_SECONDS);
  const totalSeconds = roundedUpMinutes * ONE_MINUTE_IN_SECONDS;

  if (totalSeconds >= ONE_DAY_IN_SECONDS) {
    const days = Math.ceil(totalSeconds / ONE_DAY_IN_SECONDS);
    if (days === 1) {
      return translate('Label.TimeLeft.Day.Singular');
    }
    return translate('Label.TimeLeft.Day.Plural', { number: String(days) });
  }

  const hours = Math.floor(totalSeconds / ONE_HOUR_IN_SECONDS);
  const minutes = Math.floor((totalSeconds % ONE_HOUR_IN_SECONDS) / ONE_MINUTE_IN_SECONDS);
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');

  return translate('Label.TimeLeft.Hours', { time: `${hh}:${mm}` });
}

export function getSuspensionDurationDays(endDate: Date): number {
  return Math.max(Math.ceil((endDate.getTime() - Date.now()) / ONE_DAY_IN_MS), 1);
}
