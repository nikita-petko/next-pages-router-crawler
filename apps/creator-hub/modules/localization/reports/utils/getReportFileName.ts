export const getReportFileName = (universeId: number, dateRangeId: string): string => {
  return `translation-contribution-report-${universeId}-${dateRangeId}.csv`;
};

export default getReportFileName;
