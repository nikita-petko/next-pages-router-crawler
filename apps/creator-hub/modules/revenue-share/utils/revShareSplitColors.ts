// Defines deterministic colors for managing-group, recipient, and unallocated revenue share chart segments.
export const MANAGING_GROUP_COLOR = '#00A2FF';
export const AGGREGATE_REMAINING_COLOR = 'var(--color-extended-gray-600)';

export const RECIPIENT_COLORS = [
  '#9E78EC',
  '#00B864',
  '#EF7A36',
  '#D8A009',
  '#F2453D',
  '#E245CD',
  '#00D0D0',
  '#55C1FF',
  '#26FF9C',
  '#B69AF1',
  '#F7C744',
  '#F29057',
  '#F4645D',
  '#EC83DE',
  '#36FFFF',
] as const;

export const UNALLOCATED_COLOR = 'var(--color-surface-300)';

export const getRecipientColorByIndex = (index: number): string =>
  RECIPIENT_COLORS[index % RECIPIENT_COLORS.length];
