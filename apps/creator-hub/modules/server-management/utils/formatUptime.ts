type ServerUptime = {
  days: number;
  hours: number;
  minutes: number;
};

const UPTIME_UNIT_OPTIONS = {
  style: 'unit',
  unitDisplay: 'narrow',
  useGrouping: false,
} as const;

function formatUptimeDuration(uptime: ServerUptime, locale: string): string {
  const formatUnit = (value: number, unit: 'day' | 'hour' | 'minute'): string =>
    new Intl.NumberFormat(locale, { ...UPTIME_UNIT_OPTIONS, unit }).format(value);

  const segments: string[] = [];
  if (uptime.days > 0) {
    segments.push(formatUnit(uptime.days, 'day'));
  }
  if (uptime.days > 0 || uptime.hours > 0) {
    segments.push(formatUnit(uptime.hours, 'hour'));
  }
  segments.push(formatUnit(uptime.minutes, 'minute'));
  return segments.join(' ');
}

export default function formatUptime(raw: string, locale: string): string {
  const firstColon = raw.indexOf(':');
  if (firstColon < 0) {
    return raw;
  }

  const daySeparator = raw.indexOf('.');
  const hasDays = daySeparator >= 0 && daySeparator < firstColon;
  const timePart = hasDays ? raw.slice(daySeparator + 1) : raw;
  const [hourPart, minutePart] = timePart.split(':');
  let days = 0;

  if (hasDays) {
    days = Number(raw.slice(0, daySeparator)) || 0;
  }

  const hours = Number(hourPart) || 0;
  const minutes = Number(minutePart) || 0;
  return formatUptimeDuration({ days, hours, minutes }, locale);
}
