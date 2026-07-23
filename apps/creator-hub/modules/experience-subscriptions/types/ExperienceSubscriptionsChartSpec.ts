export enum ExperienceSubscriptionsChartKey {
  Sales = 'Sales',
  Revenue = 'Revenue',
  SalesByProduct = 'SalesByProduct',
  RevenueByProduct = 'RevenueByProduct',
  SalesBySubscriptionType = 'SalesBySubscriptionType',
  CancellationsBySubscriptionType = 'CancellationsBySubscriptionType',
  SalesByPlatform = 'SalesByPlatform',
  RevenueByPlatform = 'RevenueByPlatform',
}

export enum ExperienceSubscriptionsChartType {
  Stacked = 'Stacked',
  Spline = 'Spline',
}

export type ExperienceSubscriptionsChartSpec = {
  startDate: Date;
  endDate: Date;
  chartKey: ExperienceSubscriptionsChartKey;
  productFilter: string | null;
};
