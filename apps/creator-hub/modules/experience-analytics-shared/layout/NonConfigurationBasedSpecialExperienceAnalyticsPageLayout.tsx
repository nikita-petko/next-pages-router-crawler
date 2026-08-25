import type { FC } from 'react';
import { useExperienceAnalyticsGameDetails } from '../context/ExperienceAnalyticsGameDetailsProvider';
import type { GenericFullAnalyticsPageLayoutProps } from './GenericFullAnalyticsPageLayout';
import GenericFullAnalyticsPageLayout from './GenericFullAnalyticsPageLayout';

export type NonConfigurationBasedSpecialExperienceAnalyticsPageLayoutProps =
  GenericFullAnalyticsPageLayoutProps;

const NonConfigurationBasedSpecialExperienceAnalyticsPageLayout: FC<
  NonConfigurationBasedSpecialExperienceAnalyticsPageLayoutProps
> = ({ isLoading, ...props }) => {
  const { isLoadingGame } = useExperienceAnalyticsGameDetails();
  return (
    <GenericFullAnalyticsPageLayout isLoading={isLoadingGame || Boolean(isLoading)} {...props} />
  );
};

export default NonConfigurationBasedSpecialExperienceAnalyticsPageLayout;

/** @deprecated -- Use CreatorAnalyticsLayout instead */
export const ExperienceAnalyticsPageLayout: FC<
  NonConfigurationBasedSpecialExperienceAnalyticsPageLayoutProps
> = (props) => {
  return <NonConfigurationBasedSpecialExperienceAnalyticsPageLayout {...props} />;
};
