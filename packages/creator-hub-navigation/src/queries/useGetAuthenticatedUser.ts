import { useMemo } from 'react';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { TUser } from '@rbx/auth';
import { UsersApi } from '@rbx/client-users/v1';
import { Configuration } from '@rbx/clients-core';
import useNavigationConfigs from '../hooks/useNavigationConfigs';
import { getBEDEV1ServiceBasePath } from '../utils/getBasePaths';
import isResponseError from '../utils/isResponseError';

const HTTP_STATUS_UNAUTHORIZED = 401;

const useGetAuthenticatedUser = (options?: Partial<UseQueryOptions<TUser | null>>) => {
  const { target, robloxEnvironment: environment } = useNavigationConfigs();
  const userApi = useMemo(() => {
    const basePath = getBEDEV1ServiceBasePath('users', target, environment);

    const configuration = new Configuration({
      basePath,
      credentials: 'include',
      enableMrRouter: true,
    });

    return new UsersApi(configuration);
  }, [environment, target]);

  return useQuery({
    enabled: options?.enabled,
    queryKey: ['AuthenticatedUser'],
    queryFn: async () => {
      try {
        const response = await userApi.v1UsersAuthenticatedGet();

        const user: TUser = {
          id: response.id ?? 0,
          name: response.name ?? '',
          displayName: response.displayName,
        };
        return user;
      } catch (error) {
        if (isResponseError(error) && error.response.status === HTTP_STATUS_UNAUTHORIZED) {
          return null;
        }
        throw error;
      }
    },
    refetchOnWindowFocus: options?.refetchOnWindowFocus,
  });
};

export default useGetAuthenticatedUser;
