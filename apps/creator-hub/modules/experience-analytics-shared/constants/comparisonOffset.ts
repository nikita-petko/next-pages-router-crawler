export const ComparisonOffset = ['7d', '14d', '28d'] as const;

export type TComparisonOffset = (typeof ComparisonOffset)[number];

export const COMPARISON_RELATIVE_OFFSET_TO_MS: Record<TComparisonOffset, number> = {
  '7d': 7 * 86_400_000,
  '14d': 14 * 86_400_000,
  '28d': 28 * 86_400_000,
};
