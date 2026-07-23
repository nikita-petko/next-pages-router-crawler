import { TFormattingSpec } from '../charts/numberFormatters';

// eslint-disable-next-line import/prefer-default-export -- More formatting specs will be added here
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
