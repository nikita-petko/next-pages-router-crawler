import React, { type FC, useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { Toggle } from '@rbx/foundation-ui';
import { EditOutlinedIcon, DeleteOutlinedIcon } from '@rbx/ui';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatMediumDateTime } from '@modules/charts-generic/charts/formatters/timeFormatters';
import { AnalyticsPageAction } from '@modules/charts-generic/layout/AnalyticsPageAction';
import type { GenericTablePaginationSpec } from '@modules/charts-generic/tables/GenericTablePagination';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import {
  ColumnType,
  type TableColumnConfig,
} from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { ConfirmDialog, EmptyState } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { AnalyticsAlertConfigState, type AnalyticsAlertDetail } from '../constants/types';
import useAlertLastModifiedByNamesQuery from '../hooks/useAlertLastModifiedByNamesQuery';
import useAnalyticsAlertResourceMutations from '../hooks/useAnalyticsAlertResourceMutations';
import useAnalyticsAlertsListQuery from '../hooks/useAnalyticsAlertsListQuery';
import {
  formatAlertConditionEquation,
  formatApiMetricDisplayName,
} from '../utils/analyticsAlertFormUtils';

enum AlertConfigColumnKey {
  Name = 'name',
  Metric = 'metric',
  Condition = 'condition',
  Description = 'description',
  TurnOnOff = 'turnOnOff',
  LastModifiedBy = 'lastModifiedBy',
  Actions = 'actions',
}

enum ConfigActionType {
  Edit = 'edit',
  Delete = 'delete',
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;

const columnConfigs: TableColumnConfig<AlertConfigColumnKey>[] = [
  {
    columnKey: AlertConfigColumnKey.Name,
    columnType: ColumnType.Text,
    titleKey: translationKey('Label.AlertName', TranslationNamespace.ExperienceAlerts),
    endAdormentColumnKeyInCompactView: AlertConfigColumnKey.Actions,
  },
  {
    columnKey: AlertConfigColumnKey.Metric,
    columnType: ColumnType.Text,
    titleKey: translationKey('Label.Metric', TranslationNamespace.Analytics),
  },
  {
    columnKey: AlertConfigColumnKey.Condition,
    columnType: ColumnType.Text,
    titleKey: translationKey('Label.Condition', TranslationNamespace.ExperienceAlerts),
  },
  {
    columnKey: AlertConfigColumnKey.Description,
    columnType: ColumnType.Text,
    titleKey: translationKey('Label.AlertDescription', TranslationNamespace.ExperienceAlerts),
  },
  {
    columnKey: AlertConfigColumnKey.TurnOnOff,
    columnType: ColumnType.Other,
    titleKey: translationKey('Title.Table.TurnOnOff', TranslationNamespace.ExperienceAlerts),
  },
  {
    columnKey: AlertConfigColumnKey.LastModifiedBy,
    columnType: ColumnType.Other,
    titleKey: translationKey('Title.Table.LastModifiedBy', TranslationNamespace.ExperienceAlerts),
  },
  {
    columnKey: AlertConfigColumnKey.Actions,
    columnType: ColumnType.Actions,
    titleKey: translationKey('Title.Table.Actions', TranslationNamespace.Analytics),
    titleOverride: '',
  },
];

const toggleStateTextForConfigState = (
  state: AnalyticsAlertConfigState,
  translate: TranslationKeyToFormattedText,
): string => {
  switch (state) {
    case AnalyticsAlertConfigState.Syncing:
      return translate(translationKey('Label.Syncing', TranslationNamespace.Analytics));
    case AnalyticsAlertConfigState.PausedByRoblox:
      return translate(
        translationKey('Description.ChartExportError', TranslationNamespace.Analytics),
      );
    case AnalyticsAlertConfigState.Error:
      return translate(
        translationKey('Description.ChartExportError', TranslationNamespace.Analytics),
      );
    case AnalyticsAlertConfigState.Enabled:
    case AnalyticsAlertConfigState.Disabled:
      return '';
    default: {
      const exhaustiveCheck: never = state;
      throw new Error(`Unhandled config state: ${String(exhaustiveCheck)}`);
    }
  }
};

const AlertConfigurationsTable: FC = () => {
  const { translate, locale } = useRAQIV2TranslationDependencies();
  const { id: universeId } = useUniverseResource();
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pendingDeleteAlertId, setPendingDeleteAlertId] = useState<string | null>(null);

  const { data: alerts = [], isLoading, isError } = useAnalyticsAlertsListQuery(universeId);
  const lastModifiedByNames = useAlertLastModifiedByNamesQuery(alerts);
  const { patchConfigState, removeAlert, isRemoveAlertPending } =
    useAnalyticsAlertResourceMutations(universeId);

  const handleDeleteConfirm = useCallback(() => {
    if (pendingDeleteAlertId == null) {
      return;
    }
    removeAlert(pendingDeleteAlertId, { onSuccess: () => setPendingDeleteAlertId(null) });
  }, [pendingDeleteAlertId, removeAlert]);

  const handleDeleteCancel = useCallback(() => setPendingDeleteAlertId(null), []);

  const navigateToAlertConfigure = useCallback(
    (alertId: string) => {
      void router.push(creatorHub.dashboard.getExperienceAlertConfigureUrl(universeId, alertId));
    },
    [router, universeId],
  );

  const handleToggle = useCallback(
    (alert: AnalyticsAlertDetail) => {
      const { configState } = alert;
      if (
        configState !== AnalyticsAlertConfigState.Enabled &&
        configState !== AnalyticsAlertConfigState.Disabled
      ) {
        return;
      }
      const nextState =
        configState === AnalyticsAlertConfigState.Enabled
          ? AnalyticsAlertConfigState.Disabled
          : AnalyticsAlertConfigState.Enabled;
      patchConfigState({ alertId: alert.alertId, configState: nextState });
    },
    [patchConfigState],
  );

  const pagedAlerts = useMemo(() => {
    const start = page * pageSize;
    return alerts.slice(start, start + pageSize);
  }, [alerts, page, pageSize]);

  const rowData = useMemo(() => {
    return pagedAlerts.map((alert) => {
      const conditionText = formatAlertConditionEquation(alert.condition, alert.metric, translate);
      const metricLabel = formatApiMetricDisplayName(alert.metric, translate);
      const toggleStateText = toggleStateTextForConfigState(alert.configState, translate);
      const isChecked = alert.configState === AnalyticsAlertConfigState.Enabled;

      return new Map<AlertConfigColumnKey, CellDataType<ConfigActionType>>([
        [
          AlertConfigColumnKey.Name,
          {
            type: ColumnType.Text,
            value: alert.name,
          },
        ],
        [
          AlertConfigColumnKey.Metric,
          {
            type: ColumnType.Text,
            value: metricLabel,
          },
        ],
        [
          AlertConfigColumnKey.Condition,
          {
            type: ColumnType.Text,
            value: conditionText,
          },
        ],
        [
          AlertConfigColumnKey.Description,
          {
            type: ColumnType.Text,
            value: alert.description,
          },
        ],
        [
          AlertConfigColumnKey.TurnOnOff,
          {
            type: ColumnType.Other,
            value: (
              <Toggle
                size='Medium'
                placement='Start'
                isChecked={isChecked}
                isDisabled={toggleStateText !== ''}
                onCheckedChange={() => handleToggle(alert)}
                label={toggleStateText}
                aria-label={translate(
                  translationKey(
                    isChecked ? 'Action.DeactivateAlert' : 'Action.ActivateAlert',
                    TranslationNamespace.Analytics,
                  ),
                )}
              />
            ),
          },
        ],
        [
          AlertConfigColumnKey.LastModifiedBy,
          {
            type: ColumnType.Other,
            value: (() => {
              const timestamp = formatMediumDateTime(alert.lastModifiedAt, locale);
              const displayName =
                alert.lastModifiedBy != null
                  ? (lastModifiedByNames.get(alert.lastModifiedBy) ?? alert.lastModifiedBy)
                  : undefined;
              return displayName != null
                ? translate(
                    translationKey('Label.ModifiedAtBy', TranslationNamespace.ExperienceAlerts),
                    { timestamp, displayName },
                  )
                : timestamp;
            })(),
          },
        ],
        [
          AlertConfigColumnKey.Actions,
          {
            type: ColumnType.Actions,
            actions: [
              {
                actionType: ConfigActionType.Edit,
                actionOn: alert.alertId,
                onActionInvoked: () => navigateToAlertConfigure(alert.alertId),
                displayLabel: translate(
                  translationKey('Action.Edit', TranslationNamespace.Analytics),
                ),
                renderedAsInNonCompactTable: 'dedicated-button',
                Icon: EditOutlinedIcon,
              },
              {
                actionType: ConfigActionType.Delete,
                actionOn: alert.alertId,
                onActionInvoked: () => setPendingDeleteAlertId(alert.alertId),
                displayLabel: translate(
                  translationKey('Action.Delete', TranslationNamespace.Analytics),
                ),
                renderedAsInNonCompactTable: 'dedicated-button',
                Icon: DeleteOutlinedIcon,
              },
            ],
          },
        ],
      ]);
    });
  }, [handleToggle, lastModifiedByNames, locale, navigateToAlertConfigure, pagedAlerts, translate]);

  const pagination: GenericTablePaginationSpec = useMemo(
    () => ({
      page,
      total: alerts.length,
      pageSize,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      setPageSize: (newSize: number) => {
        setPageSize(newSize);
        setPage(0);
      },
      onNextPage: () => setPage((p) => p + 1),
      onPreviousPage: () => setPage((p) => Math.max(0, p - 1)),
      hasNext: (page + 1) * pageSize < alerts.length,
      hasPrevious: page > 0,
    }),
    [page, pageSize, alerts.length],
  );

  const getRowKey = useCallback(
    (_: Map<AlertConfigColumnKey, CellDataType<ConfigActionType>>, index: number) =>
      `config-${pagedAlerts[index]?.alertId ?? index}`,
    [pagedAlerts],
  );

  const isEmptyState = !isLoading && !isError && alerts.length === 0;

  const emptyStateTitle = translate(
    translationKey('Title.EmptyState.Alert', TranslationNamespace.ExperienceAlerts),
  );

  const emptyStateDescription = translate(
    translationKey('Description.EmptyState.Alert', TranslationNamespace.ExperienceAlerts),
  );

  const createLabel = translate(translationKey('Action.Create', TranslationNamespace.Analytics));

  return (
    <>
      {isEmptyState ? (
        <EmptyState
          title={emptyStateTitle}
          description={emptyStateDescription}
          illustration='notifications'>
          <AnalyticsPageAction
            text={createLabel}
            as='a'
            href={creatorHub.dashboard.getExperienceAlertCreateUrl(universeId)}
          />
        </EmptyState>
      ) : (
        <GenericTableV2
          columnConfigs={columnConfigs}
          rowData={rowData}
          isDataLoading={isLoading}
          isResponseFailed={isError}
          isUserForbidden={false}
          showNoDataMessage={false}
          pagination={pagination}
          tableConfig={{
            stickyHeader: true,
            hover: true,
            tableBorder: false,
            stickyLastColumn: true,
          }}
          getRowKey={getRowKey}
        />
      )}
      <ConfirmDialog
        open={pendingDeleteAlertId !== null}
        title={translate(
          translationKey('Title.DeleteAlert', TranslationNamespace.ExperienceAlerts),
        )}
        content={translate(
          translationKey(
            'Description.DeleteAlertConfirmation',
            TranslationNamespace.ExperienceAlerts,
          ),
        )}
        confirmText={translate(translationKey('Action.Delete', TranslationNamespace.Controls))}
        cancelText={translate(
          translationKey('Action.Cancel', TranslationNamespace.ExperienceAlerts),
        )}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isRemoveAlertPending}
      />
    </>
  );
};

export default React.memo(AlertConfigurationsTable);
