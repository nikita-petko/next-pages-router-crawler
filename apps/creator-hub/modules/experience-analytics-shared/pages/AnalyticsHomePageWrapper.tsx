import React, { FC } from 'react';
import getCreatorAnalyticsPageLayout from './getCreatorAnalyticsPageLayout';

const AnalyticsHomePageWrapper: FC<React.PropsWithChildren> = ({ children }) => {
  if (!children) {
    return null;
  }
  return getCreatorAnalyticsPageLayout(children);
};

export default AnalyticsHomePageWrapper;
