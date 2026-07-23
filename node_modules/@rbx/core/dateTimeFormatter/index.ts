const fullDateFormat: Array<Intl.DateTimeFormatOptions> = [
  { year: 'numeric', month: 'short', day: 'numeric' },
  { hour: 'numeric', minute: 'numeric', hour12: true },
];
const dateTimeConstants = {
  filteredOutPartType: 'literal',
  defaultDelimiter: ' | ',
  partOneDefault: 'month',
  partTwoDefault: 'day',
  partThreeDefault: 'year',
};

export class DateTimeFormatter {
  locale: string;

  constructor(locale: string) {
    this.locale = locale;
  }

  getShortDate(date: Date) {
    return this.getCustomDateTime(date);
  }

  getFullDate(date: Date, delimiter = dateTimeConstants.defaultDelimiter) {
    const firstHalfOfFullDate = this.getCustomDateTime(date, fullDateFormat[0]);
    const secondHalfOfFullDate = this.getCustomDateTime(date, fullDateFormat[1]);

    return firstHalfOfFullDate + delimiter + secondHalfOfFullDate;
  }

  getOrderedDateParts(options: Intl.DateTimeFormatOptions) {
    const formatter = new Intl.DateTimeFormat(this.locale, options);
    let parts;
    // As of 03/27/2019 Internet Explorer doesn't support formatToParts so we use a default value
    // If you want the polyfill (additional code bloat we decided against using), here it is:
    // https://github.com/tc39/proposal-intl-formatToParts
    try {
      parts = formatter.formatToParts(new Date());
    } catch (error) {
      parts = [
        { type: dateTimeConstants.partOneDefault },
        { type: dateTimeConstants.partTwoDefault },
        { type: dateTimeConstants.partThreeDefault },
      ];
    }
    return parts.filter((part) => part.type !== dateTimeConstants.filteredOutPartType);
  }

  getCustomDateTime(date?: Date, options?: Intl.DateTimeFormatOptions) {
    // date may be a utc value or date string in which case we need to format it
    // as new Date object
    let newDate = date || new Date();
    if (typeof date === 'string' || typeof date === 'number') {
      newDate = new Date(date);
    }
    try {
      const formatter = new Intl.DateTimeFormat(this.locale, options);
      return formatter.format(newDate); // this will i18n'ize the date
    } catch (error) {
      return '';
    }
  }
}

const getDateTimeFormatter = (locale: string) => {
  return new DateTimeFormatter(locale);
};

export default getDateTimeFormatter;
