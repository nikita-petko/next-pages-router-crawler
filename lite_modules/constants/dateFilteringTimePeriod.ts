// Cannot be const enum as we iterate over it (Object.keys(DateFilteringTimePeriod))
// Based on AMA DateFilteringTimePeriod type: https://sourcegraph.rbx.com/search?q=context:global+repo:%5Egithub%5C.rbx%5C.com/Roblox/ads%24+DateFilteringTimePeriod&patternType=keyword&sm=0
enum DateFilteringTimePeriod {
  DATE_FILTERING_TIME_PERIOD_UNSPECIFIED = 0,

  DATE_FILTERING_TIME_PERIOD_TODAY = 1,

  DATE_FILTERING_TIME_PERIOD_YESTERDAY = 2,

  DATE_FILTERING_TIME_PERIOD_SEVEN_DAYS = 3,

  DATE_FILTERING_TIME_PERIOD_THIRTY_DAYS = 4,

  DATE_FILTERING_TIME_PERIOD_THIS_MONTH = 5,

  DATE_FILTERING_TIME_PERIOD_LAST_MONTH = 6,

  DATE_FILTERING_TIME_PERIOD_YEAR_TO_DATE = 7,

  DATE_FILTERING_TIME_PERIOD_PREVIOUS_YEAR = 8,
}

interface DateFilteringTimePeriodOption {
  labelKey: string;
  value: DateFilteringTimePeriod;
}

/**
 * Shared option list (value + Report translation key) for the user-facing
 * date range pickers. Consumed by both the page-level DateQuickPick and the
 * campaign details drawer's CampaignReportingCharts period selector so the two
 * always offer the same options in the same order.
 */
export const DATE_FILTERING_TIME_PERIOD_OPTIONS: DateFilteringTimePeriodOption[] = [
  { labelKey: 'Label.Today', value: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_TODAY },
  {
    labelKey: 'Label.Yesterday',
    value: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_YESTERDAY,
  },
  {
    labelKey: 'Label.Last7Days',
    value: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_SEVEN_DAYS,
  },
  {
    labelKey: 'Label.Last30Days',
    value: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_THIRTY_DAYS,
  },
  {
    labelKey: 'Label.ThisMonth',
    value: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_THIS_MONTH,
  },
  {
    labelKey: 'Label.LastMonth',
    value: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_LAST_MONTH,
  },
  {
    labelKey: 'Label.YearToDate',
    value: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_YEAR_TO_DATE,
  },
  {
    labelKey: 'Label.PreviousYear',
    value: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_PREVIOUS_YEAR,
  },
];

export const IsValidDateFilteringTimePeriod = (value: number): value is DateFilteringTimePeriod =>
  Object.values(DateFilteringTimePeriod).includes(value as DateFilteringTimePeriod);

export default DateFilteringTimePeriod;
