import moment from 'moment-timezone';

import {
  FileTypeServerValues,
  FileTypeText,
  ReportDownloadModelFieldNames,
  ReportTypeServerValues,
  ReportTypeText,
} from '@constants/reportDownload';
import { CreateReportDownloadRequest, ReportDownloadFormValues } from '@type/reportDownload';

export const ConvertFormDataToCreateReportDownloadRequest = ({
  isNewFlowType,
  timezoneDbName,
  values,
}: {
  isNewFlowType?: boolean;
  timezoneDbName?: string;
  values: ReportDownloadFormValues;
}): CreateReportDownloadRequest => {
  let reportType: ReportTypeServerValues;

  if (values[ReportDownloadModelFieldNames.REPORT_TYPE] === ReportTypeText.DAILY_AGGREGATE) {
    reportType = isNewFlowType
      ? ReportTypeServerValues.REPORT_TYPE_DAILY_AGGREGATE
      : ReportTypeServerValues.REPORT_TYPE_DAILY_AGGREGATE_CLASSIC;
  } else {
    reportType = isNewFlowType
      ? ReportTypeServerValues.REPORT_TYPE_TOTAL_AGGREGATE
      : ReportTypeServerValues.REPORT_TYPE_TOTAL_AGGREGATE_CLASSIC;
  }

  let fileType = FileTypeServerValues.FILE_TYPE_CSV;

  if (values[ReportDownloadModelFieldNames.FILE_TYPE] === FileTypeText.EXCEL) {
    fileType = FileTypeServerValues.FILE_TYPE_XLSX;
  }

  // Convert dates to account timezone
  // Start date: beginning of day (00:00:00) in account timezone
  // End date: end of day (23:59:59.999) in account timezone
  let startDateIso: string;
  let endDateIso: string;

  if (timezoneDbName) {
    // Extract date components from the Date object and interpret them in the target timezone
    // This ensures the same calendar date is used regardless of the user's local timezone
    const startDate = values.startDate as Date;
    const endDate = values.endDate as Date;

    const startMoment = moment
      .tz(
        {
          date: startDate.getDate(),
          month: startDate.getMonth(),
          year: startDate.getFullYear(),
        },
        timezoneDbName,
      )
      .startOf('day');

    const endMoment = moment
      .tz(
        {
          date: endDate.getDate(),
          month: endDate.getMonth(),
          year: endDate.getFullYear(),
        },
        timezoneDbName,
      )
      .endOf('day');

    startDateIso = startMoment.toISOString();
    endDateIso = endMoment.toISOString();
  } else {
    // Fallback to original behavior if timezone not provided
    startDateIso = (values.startDate as Date).toISOString();
    endDateIso = (values.endDate as Date).toISOString();
  }

  return {
    endDate: endDateIso,
    fileType,
    reportType,
    startDate: startDateIso,
  };
};
