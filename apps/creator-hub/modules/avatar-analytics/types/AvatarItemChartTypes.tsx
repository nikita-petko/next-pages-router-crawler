import { AvatarItemMetric } from '@modules/clients/analytics';

export enum AvatarItemChartKey {
  Sales = 'Sales',
  Revenue = 'Revenue',
}

export type AvatarItemChartSpec = {
  startDate: Date;
  endDate: Date;
  chartKey: AvatarItemChartKey;
  metric: AvatarItemMetric;
};
