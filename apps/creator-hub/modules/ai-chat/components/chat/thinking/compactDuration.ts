export interface CompactDurationParts {
  hours: number;
  minutes: number;
  seconds: number;
}

export function getCompactDurationParts(durationMs: number): CompactDurationParts {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function formatCompactDuration(durationMs: number, locale: string): string {
  const { hours, minutes, seconds } = getCompactDurationParts(durationMs);
  const fmt = (value: number, unit: 'hour' | 'minute' | 'second') =>
    new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'narrow' }).format(value);
  if (hours > 0) {
    return minutes > 0 ? `${fmt(hours, 'hour')} ${fmt(minutes, 'minute')}` : fmt(hours, 'hour');
  }
  if (minutes > 0) {
    return seconds > 0
      ? `${fmt(minutes, 'minute')} ${fmt(seconds, 'second')}`
      : fmt(minutes, 'minute');
  }
  return fmt(seconds, 'second');
}
