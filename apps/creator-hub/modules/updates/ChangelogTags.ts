export const CHANGELOG_TAG_LABELS = [
  'Featured',
  'Studio',
  'Engine',
  'APIs',
  'Social',
  'Discovery',
  'Safety',
  'Policy',
  'Analytics',
  'Monetization',
  'Avatar',
  'AI',
  'Ads',
  'Creator Hub',
] as const;

export const CHANGELOG_TAG_VALUES = new Set(
  CHANGELOG_TAG_LABELS.map((label) => label.toLowerCase().replace(/\s+/g, '-')),
);

export const CHANGELOG_MORE_TAG_OPTIONS = CHANGELOG_TAG_LABELS.map((label) => ({
  label,
  value: label.toLowerCase().replace(/\s+/g, '-'),
}));
