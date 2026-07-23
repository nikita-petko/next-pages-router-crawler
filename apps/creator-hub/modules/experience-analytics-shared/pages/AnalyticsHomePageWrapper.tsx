import type { FC } from 'react';
import React from 'react';
import getCreatorAnalyticsPageLayout from './getCreatorAnalyticsPageLayout';

const AnalyticsHomePageWrapper: FC<React.PropsWithChildren> = ({ children }) => {
  if (!children) {
    return null;
  }
  return getCreatorAnalyticsPageLayout(children);
};

export default AnalyticsHomePageWrapper;
