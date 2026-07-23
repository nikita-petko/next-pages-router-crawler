import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { useSnackbar } from '@rbx/ui';
import useEnvironment from '@modules/react-query/environments/environmentQueries';

export type EnvironmentContextValue = Pick<
  ReturnType<typeof useEnvironment>,
  'data' | 'isLoading' | 'error' | 'refetch'
>;

const EnvironmentContext = createContext<EnvironmentContextValue | null>(null);

const EnvironmentProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const existingContext = useContext(EnvironmentContext);
  const router = useRouter();
  const { id: gameId, environmentId } = router.query;
  const { enqueue } = useSnackbar();
  const { translate } = useTranslation();

  const { data, isLoading, error, refetch } = useEnvironment(
    gameId as string,
    environmentId as string,
  );

  useEffect(() => {
    if (error) {
      enqueue({
        message: translate('Response.UnknownError'),
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHide: true,
      });
    }
  }, [enqueue, error, translate]);

  const value = useMemo(
    () => ({
      data,
      isLoading,
      error,
      refetch,
    }),
    [data, error, isLoading, refetch],
  );

  // If we're already within an EnvironmentProvider, just pass through the children
  if (existingContext) {
    return <>{children}</>;
  }

  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
};

export default EnvironmentProvider;

export const useCurrentEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useCurrentEnvironment must be used within an EnvironmentProvider');
  }

  return context;
};
