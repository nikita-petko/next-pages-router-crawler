import React, { FC, Fragment } from 'react';
import { AvatarAnalyticsMetricsSalesProvider } from './AvatarAnalyticsMetricsSalesProvider';
import { AvatarAnalyticsMetricsRevenueProvider } from './AvatarAnalyticsMetricsRevenueProvider';
import { AvatarAnalyticsMetricsSalesComparisonProvider } from './AvatarAnalyticsMetricsSalesComparisonProvider';
import { AvatarAnalyticsMetricsRevenueComparisonProvider } from './AvatarAnalyticsMetricsRevenueComparisonProvider';

const DataProviders = [
  AvatarAnalyticsMetricsSalesProvider,
  AvatarAnalyticsMetricsRevenueProvider,
  AvatarAnalyticsMetricsSalesComparisonProvider,
  AvatarAnalyticsMetricsRevenueComparisonProvider,
];

const AvatarAnalyticsDataProviders: FC<React.PropsWithChildren> = ({ children }) => {
  const StackedProviders = DataProviders.reduce((previousChildren, CurrentProvider) => {
    return <CurrentProvider>{previousChildren}</CurrentProvider>;
  }, children);

  return <Fragment>{StackedProviders}</Fragment>;
};

export default AvatarAnalyticsDataProviders;
