import React, { FC, useMemo } from 'react';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { CircularProgress } from '@rbx/ui';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { TFlag } from '@modules/feature-flags/types';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';

type AnalyticsFlagGatedContextProps =
  | {
      flag: TFlag<FeatureFlagNamespace.Analytics>;
      flagsOperation?: undefined;
    }
  | {
      flag: Array<TFlag<FeatureFlagNamespace.Analytics>>;
      flagsOperation: 'all' | 'or';
    };

const AnalyticsFlagGatedContext: FC<React.PropsWithChildren<AnalyticsFlagGatedContextProps>> = ({
  flag,
  flagsOperation,
  children,
}) => {
  const analyticsFlags = useFeatureFlagsForNamespace(
    Array.isArray(flag) ? flag : [flag],
    FeatureFlagNamespace.Analytics,
  );
  const shouldRender = useMemo(() => {
    if (Array.isArray(flag)) {
      switch (flagsOperation) {
        case 'all': {
          return flag.every((f) => analyticsFlags[f]);
        }
        case 'or': {
          return flag.some((f) => analyticsFlags[f]);
        }
        case undefined: {
          throw new Error('flagsOperation is required when flag is an array');
        }
        default: {
          const exhaustiveCheck: never = flagsOperation;
          throw new Error(`Unhandled flags operation: ${exhaustiveCheck}`);
        }
      }
    }
    return analyticsFlags[flag];
  }, [analyticsFlags, flag, flagsOperation]);

  if (!analyticsFlags.isFetched) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='loading' />
      </EmptyGrid>
    );
  }

  if (shouldRender) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
};

export default AnalyticsFlagGatedContext;
