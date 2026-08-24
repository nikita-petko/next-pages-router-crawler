export const MILLISECONDS_PER_MINUTE = 60_000;

export const durationMillisecondsToMinutes = (
  durationMilliseconds: number | null | undefined,
): number | null =>
  durationMilliseconds == null ? null : durationMilliseconds / MILLISECONDS_PER_MINUTE;
