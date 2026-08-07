import type { TFormattingSpec } from '../charts/numberFormatters';
import { NumberIcon } from '../charts/numberFormatters';

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

export const wholePercentageFormattingSpec: TFormattingSpec = {
  abbreviate: false,
  prefix: undefined,
  suffix: undefined,
  numberFormatOptions: {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    style: 'percent',
  },
};

export const roughPercentageFormattingSpec: TFormattingSpec = {
  abbreviate: false,
  numberFormatOptions: {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    style: 'percent',
  },
};

export const integerFormattingSpec: TFormattingSpec = {
  abbreviate: false,
  numberFormatOptions: {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  },
};

export const abbreviatedIntegerFormattingSpec: TFormattingSpec = {
  abbreviate: true,
  numberFormatOptions: {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  },
};

export const robuxFormattingSpec: TFormattingSpec = {
  abbreviate: false,
  icon: NumberIcon.Robux,
  numberFormatOptions: {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  },
};

export const abbreviatedRobuxFormattingSpec: TFormattingSpec = {
  abbreviate: true,
  icon: NumberIcon.Robux,
  numberFormatOptions: {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  },
};

export const oneDecimalFormattingSpec: TFormattingSpec = {
  abbreviate: false,
  numberFormatOptions: {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  },
};

export const currencyFormattingSpec: TFormattingSpec = {
  abbreviate: false,
  numberFormatOptions: {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
};

export const legacyPercentageFormattingSpec: TFormattingSpec = {
  abbreviate: false,
  scalingFactor: 0.01,
  numberFormatOptions: {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'percent',
  },
};
