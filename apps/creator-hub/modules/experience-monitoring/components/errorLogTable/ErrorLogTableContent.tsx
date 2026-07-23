import React, { FC, useMemo } from 'react';
import {
  PlaceVersionNumber,
  SupportedLogSeverities,
  SupportedLogSources,
} from '@modules/clients/analytics/universePerformanceRaqi';
import { TranslationKey } from '@modules/analytics-translations';
import ErrorLogTable from './ErrorLogTable';
import ErrorLogTableRow from './ErrorLogTableRow';
import useErrorLogsRequest, { PAGE_SIZE } from '../useErrorLogsRequest';

type ErrorLogTableContentProps = {
  universeId: number;
  titleKey: TranslationKey;
  startDate: Date;
  endDate: Date;
  placeId: number | null;
  placeVersionFilter: PlaceVersionNumber[] | null;
  textFilter?: string;
  logSeverityFilter?: SupportedLogSeverities;
  logSourceFilter?: SupportedLogSources;
};

const ErrorLogTableContent: FC<ErrorLogTableContentProps> = ({
  titleKey,
  universeId,
  startDate,
  endDate,
  placeId,
  placeVersionFilter,
  textFilter,
  logSeverityFilter,
  logSourceFilter,
}) => {
  const request = useMemo(() => {
    return {
      universeId,
      startTime: startDate,
      endTime: endDate,
      placeId,
      placeVersionFilter,
      textFilter,
      logSeverityFilter,
      logSourceFilter,
    };
  }, [
    endDate,
    logSeverityFilter,
    logSourceFilter,
    placeId,
    placeVersionFilter,
    startDate,
    textFilter,
    universeId,
  ]);

  const {
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    page,
    total,
    nextPage,
    previousPage,
    data,
  } = useErrorLogsRequest(request);

  return (
    <ErrorLogTable
      titleKey={titleKey}
      isDataLoading={isDataLoading}
      isResponseFailed={isResponseFailed}
      isUserForbidden={isUserForbidden}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
      onNextPage={nextPage}
      onPreviousPage={previousPage}>
      {data.map((errorLog) => (
        <ErrorLogTableRow
          key={errorLog.message}
          count={errorLog.count ?? 0}
          severity={(errorLog.logSeverity?.toLowerCase() as 'warning' | 'error') ?? 'error'}
          type={(errorLog.logSource as 'Server' | 'Client') ?? 'Server'}
          message={errorLog.message ?? ''}
          stackTrace={errorLog.stacktrace ?? ''}
        />
      ))}
    </ErrorLogTable>
  );
};

export default ErrorLogTableContent;
