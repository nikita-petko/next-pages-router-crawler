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

  DATE_FILTERING_TIME_PERIOD_CUSTOM = 9,
}

export default DateFilteringTimePeriod;
