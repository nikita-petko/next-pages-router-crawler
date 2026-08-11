import type { FC } from 'react';
import BreadcrumbItemType from '@modules/navigation/layout/enums/BreadcrumbsItemType';
import useBreadcrumbRegistration from '@modules/navigation/layout/hooks/useBreadcrumbRegistration';

type CustomDashboardBreadcrumbRegistrationProps = {
  readonly dashboardName: string | undefined;
};

const CustomDashboardBreadcrumbRegistration: FC<CustomDashboardBreadcrumbRegistrationProps> = ({
  dashboardName,
}: CustomDashboardBreadcrumbRegistrationProps) => {
  useBreadcrumbRegistration(BreadcrumbItemType.AnalyticsCustomDashboards, dashboardName);

  return null;
};

export default CustomDashboardBreadcrumbRegistration;
