import React, { FC } from 'react';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { CircularProgress } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';

type AnalyticsPermissionControlledContextProps = {
  permissionType: 'userCanViewAnalyticsForUniverse';
};

const AnalyticsPermissionControlledContext: FC<
  React.PropsWithChildren<AnalyticsPermissionControlledContextProps>
> = ({ children, permissionType }) => {
  const { userCanViewAnalyticsForUniverse, isFetched } = useFeatureFlagsForNamespace(
    'userCanViewAnalyticsForUniverse',
    FeatureFlagNamespace.Analytics,
  );
  if (!isFetched) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='loading' />
      </EmptyGrid>
    );
  }
  if (permissionType === 'userCanViewAnalyticsForUniverse' && userCanViewAnalyticsForUniverse) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
};

export default AnalyticsPermissionControlledContext;
