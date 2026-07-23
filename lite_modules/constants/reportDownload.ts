export enum ReportCreationStatus {
  REPORT_CREATION_STATUS_UNSPECIFIED = 0,
  REPORT_CREATION_STATUS_NOT_STARTED = 1,
  REPORT_CREATION_STATUS_IN_PROGRESS = 2,
  REPORT_CREATION_STATUS_READY_TO_DOWNLOAD = 3,
  REPORT_CREATION_STATUS_OUTDATED = 4,
  REPORT_CREATION_STATUS_CANCELLED = 5,
  REPORT_CREATION_STATUS_UNKNOWN = 6,
}

// https://github.rbx.com/Roblox/ads/blob/f062aadeffa2da1721aecba67f3a6083c9abb646/protos/roblox/ads/shared/enums/v3/ad_entity_enums.proto#L275
export enum ReportTypeServerValues {
  REPORT_TYPE_UNSPECIFIED = 0,
  REPORT_TYPE_DAILY_AGGREGATE_CLASSIC = 1,
  REPORT_TYPE_TOTAL_AGGREGATE_CLASSIC = 2,
  REPORT_TYPE_DAILY_AGGREGATE = 3,
  REPORT_TYPE_TOTAL_AGGREGATE = 4,
}

export enum FileTypeServerValues {
  FILE_TYPE_UNSPECIFIED = 0,
  FILE_TYPE_CSV = 1,
  FILE_TYPE_XLSX = 2,
}

export enum ReportTypeText {
  DAILY_AGGREGATE = 'DAILY AGGREGATE',
  TOTAL_AGGREGATE = 'TOTAL AGGREGATE',
}

export enum FileTypeText {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
}

export enum ReportDownloadModelFieldNames {
  END_DATE = 'endDate',
  FILE_TYPE = 'fileType',
  REPORT_TYPE = 'reportType',
  START_DATE = 'startDate',
}

export const ReportDownloadModel = {
  endDate: {
    label: 'Label.EndDate',
    name: ReportDownloadModelFieldNames.END_DATE,
  },
  fileType: {
    csv: {
      label: 'Label.CSV',
      name: 'fileTypeCsv',
      value: FileTypeText.CSV,
    },
    excel: {
      label: 'Label.Excel',
      name: 'fileTypeExcel',
      value: FileTypeText.EXCEL,
    },
    initValue: FileTypeText.CSV,
    name: ReportDownloadModelFieldNames.FILE_TYPE,
  },
  reportType: {
    dailyAggregate: {
      label: 'Label.DailyBreakdown',
      name: 'reportTypeDailyAggregate',
      value: ReportTypeText.DAILY_AGGREGATE,
    },
    initValue: ReportTypeText.TOTAL_AGGREGATE,
    name: ReportDownloadModelFieldNames.REPORT_TYPE,
    totalAggregate: {
      label: 'Label.Aggregated',
      name: 'reportTypeAggregated',
      value: ReportTypeText.TOTAL_AGGREGATE,
    },
  },
  startDate: {
    label: 'Label.StartDate',
    name: ReportDownloadModelFieldNames.START_DATE,
  },
};
