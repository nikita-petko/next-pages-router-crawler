import React, { FC, ReactElement } from 'react';

import { FormattedText } from '@modules/analytics-translations';

import { useExperienceAnalyticsGameDetails } from '../context/ExperienceAnalyticsGameDetailsProvider';
import AnalyticsTabContentLayout from './AnalyticsTabContentLayout';
import GenericAnalyticsTabbedPageLayout, {
  GenericAnalyticsTabbedPageLayoutProps,
} from './GenericAnalyticsTabbedPageLayout';

export type AnalyticsTabConfig = {
  key: string;
  label: FormattedText;
  content: ReactElement<typeof AnalyticsTabContentLayout>;
};

export type NonConfigurationBasedExperienceAnalyticsTabbedPageLayoutProps = Omit<
  GenericAnalyticsTabbedPageLayoutProps,
  'isLoading'
>;

const NonConfigurationBasedExperienceAnalyticsTabbedPageLayout: FC<
  NonConfigurationBasedExperienceAnalyticsTabbedPageLayoutProps
> = ({ ...props }) => {
  const { isLoadingGame } = useExperienceAnalyticsGameDetails();
  return <GenericAnalyticsTabbedPageLayout {...props} isLoading={isLoadingGame} />;
};

export default NonConfigurationBasedExperienceAnalyticsTabbedPageLayout;

/** @deprecated -- Use CreatorAnalyticsLayout instead */
export const ExperienceAnalyticsTabbedPageLayout: FC<
  NonConfigurationBasedExperienceAnalyticsTabbedPageLayoutProps
> = (props) => {
  return <NonConfigurationBasedExperienceAnalyticsTabbedPageLayout {...props} />;
};
