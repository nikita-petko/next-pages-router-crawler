export function addDays(curr: Date, diff: number) {
  const newDay = new Date(curr.toISOString());
  newDay.setDate(curr.getDate() + diff);
  return newDay;
}

export function subDays(curr: Date, diff: number) {
  return addDays(curr, -diff);
}

export function addMonths(curr: Date, diff: number) {
  const newDay = new Date(curr.toISOString());
  newDay.setMonth(curr.getMonth() + diff);
  return newDay;
}

export function subMonths(curr: Date, diff: number) {
  return addMonths(curr, -diff);
}

export function addYears(curr: Date, diff: number) {
  const newDay = new Date(curr.toISOString());
  newDay.setFullYear(curr.getFullYear() + diff);
  return newDay;
}

export function subYears(curr: Date, diff: number) {
  return addYears(curr, -diff);
}

export function startOfToday() {
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  return current;
}

export function endOfToday() {
  // return a Date object to 23:59:59:999 (lcoal time)
  const current = new Date();
  current.setHours(23, 59, 59, 999);
  return current;
}

export function getUtcQueryString(localDate: Date) {
  if (!localDate) {
    return '';
  }
  // return date string in UTC, YYYY-MM-DD format
  const utcMonth = (localDate.getUTCMonth() + 1).toString().padStart(2, '0');
  const utcDate = localDate.getUTCDate().toString().padStart(2, '0');
  const queryString = `${localDate.getUTCFullYear()}-${utcMonth}-${utcDate}`;
  return queryString;
}

export default {
  getUtcQueryString,
  endOfToday,
  startOfToday,
  addYears,
  subYears,
  addMonths,
  subMonths,
  addDays,
  subDays,
};
