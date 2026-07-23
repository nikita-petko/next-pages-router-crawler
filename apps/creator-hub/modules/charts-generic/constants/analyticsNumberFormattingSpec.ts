import type { TFormattingSpec } from '../charts/numberFormatters';

export const percentageFormattingSpec: TFormattingSpec = {
  abbreviate: false,
  prefix: undefined,
  suffix: undefined,
  numberFormatOptions: {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'percent',
  },
};
