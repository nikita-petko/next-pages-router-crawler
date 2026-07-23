import React, { FC } from 'react';
import { useExperienceAnalyticsGameDetails } from '../context/ExperienceAnalyticsGameDetailsProvider';
import GenericFullAnalyticsPageLayout, {
  GenericFullAnalyticsPageLayoutProps,
} from './GenericFullAnalyticsPageLayout';

export type NonConfigurationBasedSpecialExperienceAnalyticsPageLayoutProps = Omit<
  GenericFullAnalyticsPageLayoutProps,
  'isLoading'
>;

const NonConfigurationBasedSpecialExperienceAnalyticsPageLayout: FC<
  NonConfigurationBasedSpecialExperienceAnalyticsPageLayoutProps
> = ({ ...props }) => {
  const { isLoadingGame } = useExperienceAnalyticsGameDetails();
  return <GenericFullAnalyticsPageLayout isLoading={isLoadingGame} {...props} />;
};

export default NonConfigurationBasedSpecialExperienceAnalyticsPageLayout;

/** @deprecated -- Use CreatorAnalyticsLayout instead */
export const ExperienceAnalyticsPageLayout: FC<
  NonConfigurationBasedSpecialExperienceAnalyticsPageLayoutProps
> = (props) => {
  return <NonConfigurationBasedSpecialExperienceAnalyticsPageLayout {...props} />;
};
