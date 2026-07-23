import { useMemo } from 'react';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import {
  RAQIV2ValidationError,
  RAQIV2ValidationErrorType,
} from '@modules/experience-analytics-shared/utils/validateRAQIV2Request';

const useTableState = ({
  regularRowsState,
  summaryRowState,
}: {
  regularRowsState: GenericChartState;
  summaryRowState?: GenericChartState;
}) => {
  const tableState = useMemo(() => {
    const error = regularRowsState.error || summaryRowState?.error;
    let showNoDataMessage = false;
    let isResponseFailed =
      regularRowsState.isResponseFailed || (summaryRowState?.isResponseFailed ?? false);

    // If request failure comes from unsupported dimensions or unsupported
    // filter values (e.g. selecting an AgeGroup value the metric doesn't
    // support on the Retention page), we show 'no data' for now for
    // consistency — mirrors genericChartStateToChartAbnormalState.
    if (
      error instanceof RAQIV2ValidationError &&
      [
        RAQIV2ValidationErrorType.UnsupportedGranularity,
        RAQIV2ValidationErrorType.UnsupportedBreakdown,
        RAQIV2ValidationErrorType.UnsupportedFilter,
        RAQIV2ValidationErrorType.UnsupportedFilterValue,
      ].includes(error.type)
    ) {
      isResponseFailed = false;
      showNoDataMessage = true;
    }

    return {
      isDataLoading: regularRowsState.isDataLoading || (summaryRowState?.isDataLoading ?? false),
      isResponseFailed,
      isUserForbidden:
        regularRowsState.isUserForbidden || (summaryRowState?.isUserForbidden ?? false),
      error,
      showNoDataMessage,
    };
  }, [
    regularRowsState.error,
    regularRowsState.isDataLoading,
    regularRowsState.isResponseFailed,
    regularRowsState.isUserForbidden,
    summaryRowState?.error,
    summaryRowState?.isDataLoading,
    summaryRowState?.isResponseFailed,
    summaryRowState?.isUserForbidden,
  ]);

  return tableState;
};

export default useTableState;
