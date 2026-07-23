export const parsePlaceVersionSortKey = (raw: string): number => {
  const trimmed = raw.trim();
  const withoutPrefix =
    trimmed.startsWith('V') || trimmed.startsWith('v') ? trimmed.slice(1) : trimmed;
  const n = Number.parseInt(withoutPrefix, 10);
  return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY;
};

/** Highest numeric version first (strip optional `V` / `v` prefix). */
export default function sortPlaceVersionFilterOptionsDescending<T extends string>(
  options: readonly T[],
): T[] {
  return [...options].sort((a, b) => parsePlaceVersionSortKey(b) - parsePlaceVersionSortKey(a));
}
