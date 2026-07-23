const numberConstants = {
  getDefinedNumberFormats: (currency: string) => ({
    currency: {
      style: 'currency',
      currency,
    },
    percent: {
      style: 'percent',
      maximumFractionDigits: 2,
    },
    decimal: {
      style: 'decimal',
      maximumFractionDigits: 2,
    },
  }),
};

export class NumberFormatter {
  locale: string;

  currency: string;

  constructor(locale: string, currency: string) {
    this.locale = locale;
    this.currency = currency;
  }

  // simple implementation from old implementation
  getCustomNumber(number: number, options: Intl.NumberFormatOptions) {
    try {
      return new Intl.NumberFormat(this.locale, options).format(number);
    } catch (error) {
      return number;
    }
  }
}

export default function localizeNumberString(
  number: number,
  options?: 'currency' | 'percent' | 'decimal' | Record<string, unknown>
) {
  if (Number.isNaN(number)) {
    throw new TypeError("The argument 'number' must be of type number");
  }

  const definedNumberFormats = numberConstants.getDefinedNumberFormats('USD');

  let formatOptions;
  if (typeof options === 'string') {
    formatOptions = definedNumberFormats[options];
  } else if (typeof options === 'object') {
    formatOptions = options;
  } else if (options === undefined) {
    formatOptions = definedNumberFormats.decimal; // default to decimal
  } else {
    throw new TypeError("'options' must be of type string or object based on Intl.NumberFormat");
  }

  return new NumberFormatter('en-US', 'USD').getCustomNumber(
    number,
    formatOptions as Intl.NumberFormatOptions
  ); // TODO: don't hard set locale
}
