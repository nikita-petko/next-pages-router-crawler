enum ChartSummaryType {
  Average = 'Average',

  // Adds all the data points together across the time range.
  // Be sure that this value is meaningful for this metric before using!
  Total = 'Total',

  // Adds all data points' absolute values together across the time range.
  TotalAbsoluteValue = 'TotalAbsoluteValue',

  // When summary is single point type, we use a selected single point value as the summary value
  SinglePoint = 'SinglePoint',

  // Growth rate is calculated as the difference between the first and last data points divided by the first data point.
  GrowthRate = 'GrowthRate',

  // Summary with quota percentage usage
  QuotaPercentageUsage = 'QuotaPercentageUsage',

  // Using Total to get the top breakdown value.
  TopBreakdown = 'TopBreakdown',
}

export default ChartSummaryType;
