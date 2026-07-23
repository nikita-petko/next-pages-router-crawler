import type { FC } from 'react';
import React from 'react';
import { StatusCodes } from '@rbx/core';
import { CircularProgress } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useAnalyticsExperiencePermissions } from '../hooks/useAnalyticsPermissions';
import { useUniverseResource } from '../hooks/useChartResourceProvider';

type AnalyticsPermissionControlledContextProps = {
  permissionType: 'userCanViewAnalyticsForUniverse';
};

const AnalyticsPermissionControlledContext: FC<
  React.PropsWithChildren<AnalyticsPermissionControlledContextProps>
> = ({ children, permissionType }) => {
  const { id: universeId } = useUniverseResource();
  const { userCanViewAnalyticsForUniverse, isPending: isPendingAnalyticsExperiencePermissions } =
    useAnalyticsExperiencePermissions(universeId);
  if (isPendingAnalyticsExperiencePermissions) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='loading' />
      </EmptyGrid>
    );
  }
  if (permissionType === 'userCanViewAnalyticsForUniverse' && userCanViewAnalyticsForUniverse) {
    return <>{children}</>;
  }
  return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
};

export default AnalyticsPermissionControlledContext;
