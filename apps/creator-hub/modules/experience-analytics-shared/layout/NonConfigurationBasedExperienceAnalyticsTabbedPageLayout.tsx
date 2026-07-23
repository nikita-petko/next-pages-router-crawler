import type { FC, ReactElement } from 'react';
import type { FormattedText } from '@modules/analytics-translations/types';
import { useExperienceAnalyticsGameDetails } from '../context/ExperienceAnalyticsGameDetailsProvider';
import type AnalyticsTabContentLayout from './AnalyticsTabContentLayout';
import type { GenericAnalyticsTabbedPageLayoutProps } from './GenericAnalyticsTabbedPageLayout';
import GenericAnalyticsTabbedPageLayout from './GenericAnalyticsTabbedPageLayout';

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
