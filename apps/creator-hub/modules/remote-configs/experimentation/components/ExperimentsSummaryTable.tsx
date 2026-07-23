import {
  AnalyticsQueryParams,
  AnalyticsSearchParams,
  analyticsExperimentsCreateNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
  CellDataType,
  ColumnType,
  GenericChartState,
  GenericTablePaginationSpec,
  GenericTableV2,
  TableColumnConfigWithoutSort,
  TableConfig,
  TableSortOrder,
} from '@modules/charts-generic';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TranslationKey,
  translationKey,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import { addDays } from '@rbx/core';
import { CloseIcon, IconButton, Snackbar } from '@rbx/ui';
import useCanConfigureOrPublish from '../../hooks/useCanConfigureOrPublish';
import {
  isExperimentDeletable,
  isExperimentEditable,
  isExperimentReschedulatbleOnly,
  isExperimentRunningAndDurationMet,
  isExperimentStoppable,
} from '../../utils/experimentProperties';
import useSingleColumnTableSort from '../../components/useSingleColumnTableSort';
import {
  ExperimentApiErrorType,
  ExperimentOperationStatus,
  ExperimentState,
  SortKey,
  SortOrder,
} from '../../api/universeExperimentationClientEnums';
import {
  ValidExperimentStateInfo,
  ValidExperimentSummary,
} from '../../api/validExperimentationTypes';
import ExperimentRampUpDialog from './ExperimentRampUpDialog';
import {
  CompleteExperiment,
  DiscardExperiment,
} from '../hooks/useExperimentActionWithOperationStatusObserver';
import useExperimentsList from '../hooks/useExperimentsList';
import { ExperimentCreationSteps } from '../hooks/useCreationStepAndQueryParams';
import { ExperimentDetailsTab, ExperimentUIStatus } from '../types/UIEnums';
import buildExperimentDetailsPageUrlWithParams from '../utils/buildExperimentDetailsPageUrlWithParams';

enum ExperimentsSummaryTableColumn {
  Status = 'status',
  Name = 'name',
  Config = 'config',
  StartDate = 'startDate',
  EndDate = 'endDate',
  Actions = 'actions',
}

const tableConfig: TableConfig<ExperimentsSummaryTableColumn> = {
  tableBorder: false,
  hover: true,
  stickyLastColumn: true,
};

const columnConfigsWithoutSort: TableColumnConfigWithoutSort<ExperimentsSummaryTableColumn>[] = [
  {
    columnKey: ExperimentsSummaryTableColumn.Status,
    titleKey: translationKey(
      'Table.Title.ExperimentStatus',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnType: ColumnType.Status,
    endAdormentColumnKeyInCompactView: ExperimentsSummaryTableColumn.Actions,
  },
  {
    columnKey: ExperimentsSummaryTableColumn.Name,
    titleKey: translationKey(
      'Table.Title.ExperimentName',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnType: ColumnType.Text,
  },
  {
    columnKey: ExperimentsSummaryTableColumn.Config,
    titleKey: translationKey(
      'Table.Title.ExperimentConfig',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnType: ColumnType.Text,
  },
  {
    columnKey: ExperimentsSummaryTableColumn.StartDate,
    titleKey: translationKey(
      'Table.Title.ExperimentStartDate',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnType: ColumnType.Date,
  },
  {
    columnKey: ExperimentsSummaryTableColumn.EndDate,
    titleKey: translationKey(
      'Table.Title.ExperimentEndDate',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnType: ColumnType.Date,
  },
  {
    columnKey: ExperimentsSummaryTableColumn.Actions,
    titleKey: translationKey(
      'Table.Title.ExperimentActions',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    columnType: ColumnType.Actions,
  },
];

const ExperimentUIStatusToChipData: Record<
  ExperimentUIStatus,
  {
    statusKey: TranslationKey;
    color: 'error' | 'success' | 'warning' | 'info' | 'primary' | 'secondary';
  }
> = {
  [ExperimentUIStatus.DecisionNeeded]: {
    statusKey: translationKey(
      'Status.Label.ExperimentResultsReady',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    color: 'error',
  },
  [ExperimentUIStatus.Running]: {
    statusKey: translationKey(
      'Status.Label.ExperimentRunning',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    color: 'warning',
  },
  [ExperimentUIStatus.Scheduled]: {
    statusKey: translationKey(
      'Status.Label.ExperimentScheduled',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    color: 'warning',
  },
  [ExperimentUIStatus.Completed]: {
    statusKey: translationKey(
      'Status.Label.ExperimentCompleted',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    color: 'success',
  },
  [ExperimentUIStatus.Draft]: {
    statusKey: translationKey(
      'Status.Label.ExperimentDraft',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    color: 'secondary',
  },
};

const getExperimentStatusForSummaryTable = (
  experiment: ValidExperimentStateInfo & {
    durationDays: number;
  },
): {
  uiStatus: ExperimentUIStatus;
  statusKey: TranslationKey;
  color: 'error' | 'success' | 'warning' | 'info' | 'primary' | 'secondary';
} => {
  let uiStatus: ExperimentUIStatus;
  switch (experiment.state) {
    case ExperimentState.Running:
      uiStatus = isExperimentRunningAndDurationMet(experiment)
        ? ExperimentUIStatus.DecisionNeeded
        : ExperimentUIStatus.Running;

      break;
    case ExperimentState.Scheduled: {
      uiStatus = ExperimentUIStatus.Scheduled;
      break;
    }
    case ExperimentState.Deleted:
    case ExperimentState.Completed:
    case ExperimentState.Cancelled: {
      uiStatus = ExperimentUIStatus.Completed;
      break;
    }
    case ExperimentState.Draft:
      uiStatus = ExperimentUIStatus.Draft;
      break;
    default: {
      const exhaustiveCheck: never = experiment;
      throw new Error(`Unhandled experiment state: ${exhaustiveCheck}`);
    }
  }
  return {
    uiStatus,
    ...ExperimentUIStatusToChipData[uiStatus],
  };
};

// The RelevanceFakeColumnKey is a placeholder column key used to enable sorting the table
// first by experiment status and then by start time by default. This fake column key allows us to
// adapt the column configurations to support this custom sort behavior.
const Relevance = 'RelevanceFakeColumnKey' as const;

const sortableColumns = [
  ExperimentsSummaryTableColumn.Name,
  ExperimentsSummaryTableColumn.StartDate,
  Relevance,
] as const;
type TSortableColumn = (typeof sortableColumns)[number];
const columnToSortKey: Record<TSortableColumn, SortKey> = {
  [ExperimentsSummaryTableColumn.Name]: SortKey.Name,
  [ExperimentsSummaryTableColumn.StartDate]: SortKey.StartTime,
  [Relevance]: SortKey.Relevance,
};
const sortKeyToColumn: Partial<Record<SortKey, TSortableColumn>> = {
  [SortKey.Name]: ExperimentsSummaryTableColumn.Name,
  [SortKey.StartTime]: ExperimentsSummaryTableColumn.StartDate,
  [SortKey.Relevance]: Relevance,
};
const defaultSortOrder: Record<TSortableColumn, TableSortOrder> = {
  [ExperimentsSummaryTableColumn.Name]: TableSortOrder.asc,
  [ExperimentsSummaryTableColumn.StartDate]: TableSortOrder.desc,
  [Relevance]: TableSortOrder.desc,
};

type ExperimentSummaryTableProps = {
  experimentsRequestState: GenericChartState;
  experimentsSummary: ValidExperimentSummary[];
  pagination: GenericTablePaginationSpec;
  sort: {
    key: SortKey;
    order: SortOrder;
    onChange: (key: SortKey, order: SortOrder) => void;
  };
};

const useExperimentSummaryTableSort = (
  sort: ExperimentSummaryTableProps['sort'],
  columnConfigs: TableColumnConfigWithoutSort<ExperimentsSummaryTableColumn | typeof Relevance>[],
) => {
  const { onChange: onSortChangeGiven, key: sortKey, order: sortOrder } = sort;
  const currentSort = useMemo(() => {
    return {
      key: sortKeyToColumn[sortKey] ?? Relevance,
      order: sortOrder === SortOrder.Ascending ? TableSortOrder.asc : TableSortOrder.desc,
    };
  }, [sortKey, sortOrder]);
  const onSortChange = (key: TSortableColumn, tableOrder: TableSortOrder) => {
    const apiOrder = tableOrder === TableSortOrder.asc ? SortOrder.Ascending : SortOrder.Descending;
    onSortChangeGiven(columnToSortKey[key], apiOrder);
  };
  const { configsWithSort } = useSingleColumnTableSort(
    currentSort,
    onSortChange,
    columnConfigs,
    sortableColumns,
    defaultSortOrder,
  );
  return configsWithSort;
};

const ExperimentsSummaryTable = ({
  stateFilters,
  searchKey,
  sort,
  completeExperiment,
  discardExperiment,
  getExperimentOperationStatus,
}: {
  stateFilters?: Array<ExperimentState>;
  searchKey?: string;
  sort: {
    key: SortKey;
    order: SortOrder;
    onChange: (key: SortKey, order: SortOrder) => void;
  };
  completeExperiment: CompleteExperiment;
  discardExperiment: DiscardExperiment;
  getExperimentOperationStatus: (
    experimentId: string,
  ) => ExperimentOperationStatus | ExperimentApiErrorType | null;
}) => {
  const { id: universeId } = useUniverseResource();
  const { canConfigure, canPublish, configureErrorMessage, publishErrorMessage } =
    useCanConfigureOrPublish();
  const { translate } = useTranslationWrapper(useTranslation());
  const { experimentsSummary, experimentsRequestState, pagination } = useExperimentsList({
    stateFilters,
    searchKey,
    sort,
  });

  const [{ message, preventItFromOpeningAgain }, setOperationToastMessage] = useState<{
    message: string;
    preventItFromOpeningAgain: boolean;
  }>({
    message: '',
    preventItFromOpeningAgain: false,
  });

  const allowOperationToastToOpen = useCallback(() => {
    setOperationToastMessage((oldMessage) => ({
      ...oldMessage,
      preventItFromOpeningAgain: false,
    }));
  }, []);
  const closeOperationToast = useCallback((keepItClosed = false) => {
    setOperationToastMessage(() => ({
      message: '',
      preventItFromOpeningAgain: keepItClosed,
    }));
  }, []);

  const experimentOperationToast = useMemo(() => {
    const shouldOpen = !!message && !preventItFromOpeningAgain;

    return (
      <Snackbar
        autoHide
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={shouldOpen}
        onClose={(_, reason) => {
          // Don't close the toast if the user clicks away or escapes the dialog
          if (reason === 'clickaway' || reason === 'escapeKeyDown') {
            return;
          }

          closeOperationToast(reason === 'timeout');
        }}
        message={message}
        action={
          <IconButton
            aria-label='Close'
            size='small'
            color='inherit'
            onClick={() => {
              closeOperationToast(true);
            }}>
            <CloseIcon />
          </IconButton>
        }
      />
    );
  }, [closeOperationToast, message, preventItFromOpeningAgain]);

  /** listen to experiment operation status changes, show message in toast if allowed */
  useEffect(() => {
    let numberOfDeletingExperiments = 0;
    let numberOfCompletingExperiments = 0;

    experimentsSummary.forEach(({ id }) => {
      const operationStatus = getExperimentOperationStatus(id);
      if (operationStatus === ExperimentOperationStatus.Deleting) {
        numberOfDeletingExperiments += 1;
      } else if (operationStatus === ExperimentOperationStatus.Stopping) {
        numberOfCompletingExperiments += 1;
      }
    });

    let messageToShow = message;
    if (numberOfDeletingExperiments === 0 && numberOfCompletingExperiments === 0) {
      closeOperationToast();
    } else if (!preventItFromOpeningAgain) {
      if (numberOfDeletingExperiments > 0 && numberOfCompletingExperiments > 0) {
        messageToShow = translate(
          translationKey(
            'Label.ExperimentOperation.DeletingAndStopping',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          {
            numOfDeleting: numberOfDeletingExperiments.toString(),
            numOfCompleting: numberOfCompletingExperiments.toString(),
          },
        );
      } else if (numberOfDeletingExperiments > 0) {
        messageToShow = translate(
          translationKey(
            'Label.ExperimentOperation.Deleting',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          {
            numOfDeleting: numberOfDeletingExperiments.toString(),
          },
        );
      } else if (numberOfCompletingExperiments > 0) {
        messageToShow = translate(
          translationKey(
            'Label.ExperimentOperation.Stopping',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          {
            numOfCompleting: numberOfCompletingExperiments.toString(),
          },
        );
      }
      setOperationToastMessage({
        message: messageToShow,
        preventItFromOpeningAgain,
      });
    }
  }, [
    closeOperationToast,
    experimentsSummary,
    getExperimentOperationStatus,
    setOperationToastMessage,
    translate,
    message,
    preventItFromOpeningAgain,
  ]);

  const columnConfigsWithSort = useExperimentSummaryTableSort(sort, columnConfigsWithoutSort);

  const [experimentIdToComplete, setExperimentIdToComplete] = useState<string | null>(null);
  const openDialog = useCallback((experiemntId: string) => {
    setExperimentIdToComplete(experiemntId);
  }, []);
  const closeDialog = useCallback(() => {
    setExperimentIdToComplete(null);
  }, []);
  const onConfirm = useCallback(
    ({ variantId, experimentId }: { variantId: string; experimentId: string }) => {
      allowOperationToastToOpen();
      completeExperiment({ variantId, experimentId });
      closeDialog();
    },
    [allowOperationToastToOpen, closeDialog, completeExperiment],
  );
  const stopDialog = useMemo(() => {
    return experimentIdToComplete ? (
      <ExperimentRampUpDialog
        experimentId={experimentIdToComplete}
        open
        onClose={closeDialog}
        onCancel={closeDialog}
        onConfirm={onConfirm}
      />
    ) : null;
  }, [closeDialog, experimentIdToComplete, onConfirm]);

  const rowData = useMemo(() => {
    return experimentsSummary.map(({ name, experimentType, configKey, ...rest }) => {
      const { statusKey, color, uiStatus } = getExperimentStatusForSummaryTable(rest);
      const operationStatus = getExperimentOperationStatus(rest.id);
      const isExperimentStopping =
        operationStatus === ExperimentOperationStatus.RampingUp ||
        operationStatus === ExperimentOperationStatus.Stopping;
      const isExperimentDeleting = operationStatus === ExperimentOperationStatus.Deleting;

      const viewExperimentUrl = buildExperimentDetailsPageUrlWithParams({
        universeId,
        experimentId: rest.id,
        tabOnOpen:
          uiStatus === ExperimentUIStatus.DecisionNeeded ||
          uiStatus === ExperimentUIStatus.Completed
            ? ExperimentDetailsTab.Results
            : undefined,
      });

      const editParams: AnalyticsSearchParams = {
        [AnalyticsQueryParams.ExperimentId]: rest.id,
        [AnalyticsQueryParams.ExperimentType]: experimentType,
      };
      if (isExperimentReschedulatbleOnly(rest.state)) {
        editParams[AnalyticsQueryParams.ExperimentStep] = ExperimentCreationSteps.Review;
      }
      const editExperimentUrl = buildExperienceAnalyticsUrlWithParams(
        analyticsExperimentsCreateNavigationItem,
        editParams,
        universeId,
      );

      const row = new Map<ExperimentsSummaryTableColumn, CellDataType>()
        .set(ExperimentsSummaryTableColumn.Status, {
          type: ColumnType.Status,
          chipType: 'dot',
          color,
          label: translate(statusKey),
        })
        .set(ExperimentsSummaryTableColumn.Name, {
          type: ColumnType.Text,
          value: name,
        })
        .set(ExperimentsSummaryTableColumn.Config, {
          type: ColumnType.Text,
          value: configKey,
        })
        .set(ExperimentsSummaryTableColumn.Actions, {
          type: ColumnType.Actions,
          actions: [
            {
              actionType: 'View',
              renderedAsInNonCompactTable: 'dedicated-button',
              actionOn: rest.id,
              href: viewExperimentUrl,
              displayLabel: translate(
                translationKey(
                  'Table.Action.ViewExperiment',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              ),
              onActionInvoked: () => {},
              disabled: !canConfigure,
              tooltipLabel: canConfigure ? undefined : configureErrorMessage,
            },
            {
              actionType: 'Edit',
              renderedAsInNonCompactTable: 'menu-item',
              actionOn: rest.id,
              href: editExperimentUrl,
              displayLabel: translate(
                translationKey(
                  'Table.Action.EditExperiment',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              ),
              onActionInvoked: () => {},
              disabled: !isExperimentEditable(rest.state) || !canPublish,
              tooltipLabel: canPublish ? undefined : publishErrorMessage,
            },
            {
              actionType: 'Stop',
              renderedAsInNonCompactTable: 'menu-item',
              actionOn: rest.id,
              displayLabel: translate(
                translationKey(
                  'Table.Action.StopExperiment',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              ),
              onActionInvoked: () => {
                openDialog(rest.id);
              },
              disabled: !isExperimentStoppable(rest.state) || isExperimentStopping || !canPublish,
              tooltipLabel: canPublish ? undefined : publishErrorMessage,
            },
            {
              actionType: 'Delete',
              renderedAsInNonCompactTable: 'menu-item',
              actionOn: rest.id,
              color: 'error',
              displayLabel: translate(
                translationKey(
                  'Table.Action.DeleteExperiment',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              ),
              onActionInvoked: () => {
                allowOperationToastToOpen();
                discardExperiment({ experimentId: rest.id });
              },
              disabled: !isExperimentDeletable(rest.state) || isExperimentDeleting || !canPublish,
              tooltipLabel: canPublish ? undefined : publishErrorMessage,
            },
          ],
        });

      switch (rest.state) {
        case ExperimentState.Running: {
          row
            .set(ExperimentsSummaryTableColumn.StartDate, {
              type: ColumnType.Date,
              value: rest.startedTime,
            })
            .set(ExperimentsSummaryTableColumn.EndDate, {
              type: ColumnType.Date,
              value: addDays(rest.startedTime, rest.durationDays),
            });
          break;
        }
        case ExperimentState.Completed: {
          row
            .set(ExperimentsSummaryTableColumn.StartDate, {
              type: ColumnType.Date,
              value: rest.startedTime,
            })
            .set(ExperimentsSummaryTableColumn.EndDate, {
              type: ColumnType.Date,
              value: rest.stoppedTime,
            });
          break;
        }
        case ExperimentState.Cancelled: {
          row
            .set(ExperimentsSummaryTableColumn.StartDate, {
              type: ColumnType.Date,
              value: rest.startedTime,
            })
            .set(ExperimentsSummaryTableColumn.EndDate, {
              type: ColumnType.Date,
              value: rest.stoppedTime,
            });
          break;
        }
        case ExperimentState.Scheduled:
          row
            .set(ExperimentsSummaryTableColumn.StartDate, {
              type: ColumnType.Date,
              value: rest.scheduledTime,
            })
            .set(ExperimentsSummaryTableColumn.EndDate, {
              type: ColumnType.Date,
              value: addDays(rest.scheduledTime, rest.durationDays),
            });
          break;
        case ExperimentState.Deleted:
        case ExperimentState.Draft: {
          break;
        }
        default: {
          const exhaustiveCheck: never = rest;
          throw new Error(`Invalid experiment state: ${exhaustiveCheck}`);
        }
      }

      return row;
    });
  }, [
    allowOperationToastToOpen,
    canConfigure,
    canPublish,
    discardExperiment,
    experimentsSummary,
    getExperimentOperationStatus,
    openDialog,
    publishErrorMessage,
    configureErrorMessage,
    translate,
    universeId,
  ]);

  return (
    <React.Fragment>
      <GenericTableV2
        {...experimentsRequestState}
        rowData={rowData}
        columnConfigs={columnConfigsWithSort}
        pagination={pagination.tablePagination}
        tableConfig={tableConfig}
      />
      {stopDialog}
      {experimentOperationToast}
    </React.Fragment>
  );
};

export default ExperimentsSummaryTable;
