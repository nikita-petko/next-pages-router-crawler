import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import { EntityType } from '@constants/entity';

export const ConvertDateFilteringEnumToString = (dateFilteringEnum: DateFilteringTimePeriod) => {
  switch (dateFilteringEnum) {
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_TODAY:
      return 'Today';
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_YESTERDAY:
      return 'Yesterday';
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_SEVEN_DAYS:
      return 'Last 7 days';
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_THIRTY_DAYS:
      return 'Last 30 days';
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_THIS_MONTH:
      return 'This Month';
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_LAST_MONTH:
      return 'Last Month';
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_YEAR_TO_DATE:
      return 'Year to Date';
    case DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_PREVIOUS_YEAR:
      return 'Previous Year';
    default:
      return 'Unspecified';
  }
};

export const ConvertEntityTypeEnumToString = (entityType: EntityType) => {
  switch (entityType) {
    case EntityType.ENTITY_TYPE_CAMPAIGN:
      return 'campaigns';
    case EntityType.ENTITY_TYPE_AD_SET:
      return 'adsets';
    case EntityType.ENTITY_TYPE_AD:
      return 'ads';
    default:
      return 'unspecified';
  }
};
