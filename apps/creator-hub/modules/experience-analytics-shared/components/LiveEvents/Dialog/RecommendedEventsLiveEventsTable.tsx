import React, { useMemo } from 'react';
import { GenericTableV2, CellDataType, ColumnType } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import {
  LiveEventsTableColumnConfigs,
  LiveEventsTableColumnKey,
  LiveEventsTableConfig,
} from '../../../constants/LiveEventsTableConfig';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import { useRecommendedEventsLiveEventsApiData } from '../../../context/dataProviders/RecommendedEventsLiveEventsApiDataProvider';
import { useNonRAQIAnalyticsCurrentFilterBundle } from '../../../context/AnalyticsCurrentFilterBundleProvider';
import { recommendedEventsLiveEventsFilterDimensions } from '../../../layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterBarConfig';
import {
  getFilterValueForDimension,
  NonRAQIUIDimension,
} from '../../../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import useRecommendedEventsLiveEventsTableDialogStyles from './RecommendedEventsLiveEventsTableDialog.styles';
import filterEventJson from './filterEventJson';

const RecommendedEventsLiveEventsTable = () => {
  const { translate } = useRAQIV2TranslationDependencies();
  const {
    classes: { tableMaxHeight },
  } = useRecommendedEventsLiveEventsTableDialogStyles();
  const { data, isLoading, isResponseFailed, isUserForbidden } =
    useRecommendedEventsLiveEventsApiData();

  const { filters } = useNonRAQIAnalyticsCurrentFilterBundle(
    recommendedEventsLiveEventsFilterDimensions,
  );
  const userIdFilterValue = getFilterValueForDimension<string>(
    filters,
    NonRAQIUIDimension.UserId,
    null,
  );
  const keywordsFilterValue = getFilterValueForDimension<string>(
    filters,
    NonRAQIUIDimension.Text,
    null,
  );

  const filteredData = useMemo(
    () =>
      data?.analyticsEvent?.filter((event) =>
        filterEventJson(event.eventDataJson, keywordsFilterValue, userIdFilterValue),
      ) ?? [],
    [data?.analyticsEvent, keywordsFilterValue, userIdFilterValue],
  );

  const tableRowData = useMemo(
    () =>
      filteredData.map((event) => {
        const parsedUserId = event.eventDataJson ? JSON.parse(event.eventDataJson).user_id : {};
        const rowData: Map<LiveEventsTableColumnKey, CellDataType> = new Map();
        rowData.set(LiveEventsTableColumnKey.EventType, {
          type: ColumnType.Text,
          value: event.eventType ?? '',
        });
        rowData.set(LiveEventsTableColumnKey.UserId, {
          type: ColumnType.Number,
          value: parsedUserId,
        });
        rowData.set(LiveEventsTableColumnKey.Timestamp, {
          type: ColumnType.Timestamp,
          value: event.timestamp ?? '',
        });
        rowData.set(LiveEventsTableColumnKey.Event, {
          type: ColumnType.RawJSONString,
          value: event.eventDataJson ?? '',
        });
        return rowData;
      }) ?? [],
    [filteredData],
  );

  if (filteredData.length === 0) {
    return (
      <EmptyStateBorder>
        <EmptyState
          title={translate(
            translationKey('EmptyState.Title.NoResultsFound', TranslationNamespace.Analytics),
          )}
          description={translate(
            translationKey('EmptyState.Description.NoResultsFound', TranslationNamespace.Analytics),
          )}
          size='small'
          illustration='search'
        />
      </EmptyStateBorder>
    );
  }

  return (
    <GenericTableV2
      isDataLoading={isLoading}
      isResponseFailed={isResponseFailed}
      isUserForbidden={isUserForbidden}
      columnConfigs={Object.values(LiveEventsTableColumnConfigs)}
      tableConfig={LiveEventsTableConfig}
      rowData={tableRowData}
      classes={{ tableContainer: tableMaxHeight }}
    />
  );
};

export default RecommendedEventsLiveEventsTable;
