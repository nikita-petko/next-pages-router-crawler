// Normalize terminatesAt: ignore values >= 3000-01-01 and set to undefined
function normalizeTerminatesAt(terminatesAt: string | Date | undefined | null): Date | undefined {
  if (!terminatesAt) {
    return undefined;
  }

  const date = terminatesAt instanceof Date ? terminatesAt : new Date(terminatesAt);
  const thresholdDate = new Date('3000-01-01');

  if (date >= thresholdDate) {
    return undefined;
  }

  return date;
}

export default normalizeTerminatesAt;
