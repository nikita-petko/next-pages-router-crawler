import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { Alert, useSnackbar } from '@rbx/ui';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import { RAQIV2FilterOperation } from '@modules/clients/analytics';
import { LogAttributeApiError, RegexOperation } from '@modules/clients/analytics/logAttribute';
import type { GetLogDetailsFilters } from '@modules/clients/analytics/universePerformanceRaqi';
import AnalyticsConfigTable from '@modules/experience-analytics-shared/components/RAQIV2/table/AnalyticsConfigTable';
import type { AnalyticsTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableConfig';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import type RAQIV2TableContext from '@modules/experience-analytics-shared/types/RAQIV2TableContext';
import {
  snapToLatestEndTime,
  snapToLatestStartTime,
} from '@modules/experience-analytics-shared/utils/snapToLatestTimestep';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useCreateUniverseRegexMutation,
  useUniverseRegexesQuery,
} from '../../hooks/useUniverseRegexes';
import {
  buildErrorLogTableV2CustomColumns,
  createErrorLogTableV2RowExpansion,
  ERROR_LOG_TABLE_V2_COLUMN_KEYS,
} from './errorLogTableV2Columns';
import ErrorReportRuleFormDialog from './ErrorReportRuleFormDialog';
import { hasDuplicateRegexRule, validateRegexPattern } from './regexRuleValidation';
import createTopErrorLogDetailsFetcher from './topErrorLogDetailsCache';

// Escape regex metacharacters so the message is treated as a literal, then anchor
// it so the rule ignores logs whose message matches this error exactly.
const escapeRegExp = (input: string): string => input.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildIgnorePattern = (message: string): string => `^${escapeRegExp(message.trim())}$`;

// Maximum number of distinct error message hashes the backend returns for the table query.
const ERROR_LOG_QUERY_LIMIT = 500;
// Matches ErrorCount's backend data_resolution_duration: 60s.
const ERROR_LOG_DATA_RESOLUTION_MS = 60 * 1000;

const getStringFilterValue = (
  filters: RAQIV2ChartContext['filter'],
  dimension: RAQIV2Dimension,
): string | undefined => {
  const value = filters?.find((filter) => filter.dimension === dimension)?.values?.[0];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const getNumericFilterValue = (
  filters: RAQIV2ChartContext['filter'],
  dimension: RAQIV2Dimension,
): number | undefined => {
  const value = getStringFilterValue(filters, dimension);
  if (!value) {
    return undefined;
  }

  const numberValue = Number(value.replace(/^V/i, ''));
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const getNumericFilterValues = (
  filters: RAQIV2ChartContext['filter'],
  dimension: RAQIV2Dimension,
): number[] => {
  const values = filters?.find((filter) => filter.dimension === dimension)?.values ?? [];
  return values.reduce<number[]>((acc, value) => {
    if (typeof value !== 'string' || !value.trim()) {
      return acc;
    }

    const numberValue = Number(value.trim().replace(/^V/i, ''));
    if (Number.isFinite(numberValue)) {
      acc.push(numberValue);
    }
    return acc;
  }, []);
};

type Props = {
  chartContext: RAQIV2ChartContext;
  isErrorReportV2Enabled: boolean;
  showFirstSeenColumn: boolean;
};

const ErrorLogTableV2: FC<Props> = ({
  chartContext,
  isErrorReportV2Enabled,
  showFirstSeenColumn,
}) => {
  const universeId = chartContext.resource.id;
  const { translate } = useRAQIV2TranslationDependencies();
  const { enqueue } = useSnackbar();
  const { mutateAsync: createRule } = useCreateUniverseRegexMutation(universeId);
  const { data: rules } = useUniverseRegexesQuery({ universeId });

  // When a message is too long to ignore in one click, fall back to the rule dialog.
  const [ignoreDialogPattern, setIgnoreDialogPattern] = useState<string | null>(null);
  const closeIgnoreDialog = useCallback(() => {
    setIgnoreDialogPattern(null);
  }, []);

  const countHeaderLabel = useMemo(
    () => translate(translationKey('ErrorLogTable.Header.Count', TranslationNamespace.Analytics)),
    [translate],
  );

  const logDetailsFilters = useMemo<GetLogDetailsFilters>(() => {
    const keyword = getStringFilterValue(chartContext.filter, RAQIV2Dimension.Keyword);
    const placeId = getNumericFilterValue(chartContext.filter, RAQIV2Dimension.Place);
    const placeVersions = getNumericFilterValues(chartContext.filter, RAQIV2Dimension.PlaceVersion);
    const firstSeenPlaceVersion = getNumericFilterValue(
      chartContext.filter,
      RAQIV2Dimension.FirstSeenPlaceVersion,
    );

    return {
      ...(keyword ? { keyword } : {}),
      ...(placeId !== undefined ? { placeId } : {}),
      ...(placeVersions.length ? { placeVersions } : {}),
      ...(firstSeenPlaceVersion !== undefined ? { firstSeenPlaceVersion } : {}),
    };
  }, [chartContext.filter]);
  const showFirstSeenPlaceVersionColumn =
    isErrorReportV2Enabled && logDetailsFilters.placeId !== undefined;

  const ignoreLabel = translate(
    translationKey('Action.ErrorReportRule.IgnoreError', TranslationNamespace.Analytics),
  );
  const successLabel = translate(
    translationKey('Toast.ErrorReportRule.IgnoreCreated', TranslationNamespace.Analytics),
  );
  const errorLabel = translate(
    translationKey('Toast.ErrorReportRule.IgnoreFailed', TranslationNamespace.Analytics),
  );

  const onIgnoreError = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) {
        return;
      }

      // For short, stable messages the exact-match pattern is valid: ignore in
      // one click. Otherwise (most commonly the pattern exceeds the length
      // limit) hand off to the dialog pre-filled with the full `^...$` pattern
      // so the user can trim it down themselves, instead of hitting a silent 400.
      const exactPattern = buildIgnorePattern(trimmed);
      if (!validateRegexPattern(exactPattern).isValid) {
        setIgnoreDialogPattern(exactPattern);
        return;
      }

      if (
        hasDuplicateRegexRule(
          {
            pattern: exactPattern,
          },
          rules ?? [],
        )
      ) {
        return;
      }

      try {
        await createRule({
          pattern: exactPattern,
          output: '',
          regexOperation: RegexOperation.Ignore,
        });
        enqueue?.({
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
          children: <Alert severity='success'>{successLabel}</Alert>,
        });
      } catch (error) {
        if (error instanceof LogAttributeApiError && error.status === 409) {
          return;
        }

        enqueue?.({
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
          children: <Alert severity='error'>{errorLabel}</Alert>,
        });
      }
    },
    [createRule, enqueue, successLabel, errorLabel, rules],
  );

  const tableContext: RAQIV2TableContext = useMemo(() => {
    const { timeAxisBounds: _omit, ...rest } = chartContext;
    return rest;
  }, [chartContext]);

  const rowExpansion = useMemo(
    () =>
      createErrorLogTableV2RowExpansion(
        showFirstSeenColumn,
        showFirstSeenPlaceVersionColumn,
        isErrorReportV2Enabled,
      ),
    [isErrorReportV2Enabled, showFirstSeenColumn, showFirstSeenPlaceVersionColumn],
  );

  const { startTime, endTime } = chartContext.timeSpec;
  const snapGranularity = chartContext.timeSpec.snapGranularity ?? chartContext.granularity;

  const snappedStartTime = useMemo(
    () => snapToLatestStartTime(startTime, snapGranularity),
    [snapGranularity, startTime],
  );
  const chartAdjustedEndTime = useMemo(
    () =>
      new Date(
        snapToLatestEndTime(endTime, snapGranularity, { snapToNext: true }).getTime() -
          ERROR_LOG_DATA_RESOLUTION_MS,
      ),
    [endTime, snapGranularity],
  );

  const config: AnalyticsTableConfig = useMemo(() => {
    const fetcher = createTopErrorLogDetailsFetcher(
      universeId,
      snappedStartTime,
      chartAdjustedEndTime,
      logDetailsFilters,
    );
    return {
      type: AnalyticsComponentType.Table,
      titleKey: translationKey('Title.ErrorLogTable', TranslationNamespace.Analytics),
      breakdowns: [RAQIV2Dimension.MessageHash],
      hideBreakdownLabelColumns: true,
      pagination: { initialPageSize: 25, pageSizeOptions: [10, 25, 50, 100] },
      ...(isErrorReportV2Enabled
        ? {
            footerKey: translationKey(
              'Footnote.ErrorLogTableFirstSeen',
              TranslationNamespace.Analytics,
            ),
          }
        : {}),
      tableConfig: {
        defaultActiveSort: ERROR_LOG_TABLE_V2_COLUMN_KEYS.count,
        stickyHeader: true,
        hover: true,
      },
      dataColumns: [
        {
          key: ERROR_LOG_TABLE_V2_COLUMN_KEYS.count,
          metric: RAQIV2Metric.ErrorCount,
          titleOverride: countHeaderLabel,
          overrides: {
            granularity: { override: RAQIV2MetricGranularity.None },
            timeSpec: { override: { startTime: snappedStartTime, endTime: chartAdjustedEndTime } },
            breakdown: { override: [RAQIV2Dimension.MessageHash] },
            limit: { override: ERROR_LOG_QUERY_LIMIT },
            // intersect filter below excludes the aggregated
            // "OtherMessageHash" bucket (-1)
            filter: {
              intersect: [
                {
                  dimension: RAQIV2Dimension.MessageHash,
                  values: ['-1'],
                  operation: RAQIV2FilterOperation.NotContains,
                },
              ],
            },
          },
          sort: {
            direction: TableSortOrder.desc,
            isFixedOrder: true,
            isServerSideSorting: true,
            hideSortIcon: true,
          },
        },
        ...buildErrorLogTableV2CustomColumns(
          fetcher,
          showFirstSeenColumn,
          showFirstSeenPlaceVersionColumn,
          isErrorReportV2Enabled
            ? {
                ignoreLabel,
                onIgnoreError,
              }
            : undefined,
        ),
      ],
    };
  }, [
    universeId,
    snappedStartTime,
    chartAdjustedEndTime,
    logDetailsFilters,
    countHeaderLabel,
    showFirstSeenColumn,
    showFirstSeenPlaceVersionColumn,
    isErrorReportV2Enabled,
    ignoreLabel,
    onIgnoreError,
  ]);

  return (
    <>
      <AnalyticsConfigTable
        config={config}
        tableContext={tableContext}
        rowExpansion={rowExpansion}
      />
      <ErrorReportRuleFormDialog
        open={ignoreDialogPattern !== null}
        existingRules={rules}
        initialPattern={ignoreDialogPattern ?? undefined}
        onClose={closeIgnoreDialog}
      />
    </>
  );
};

export default ErrorLogTableV2;
