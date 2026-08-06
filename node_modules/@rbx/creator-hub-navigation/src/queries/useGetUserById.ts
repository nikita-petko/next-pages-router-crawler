import { useMemo } from 'react';
import { skipToken, useQuery } from '@tanstack/react-query';
import { UsersApi } from '@rbx/client-users/v1';
import { Configuration } from '@rbx/clients-core';
import useNavigationConfigs from '../hooks/useNavigationConfigs';
import { getBEDEV1ServiceBasePath } from '../utils/getBasePaths';

const useGetUserById = (userId?: number) => {
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
    queryKey: ['User', userId],
    queryFn: () => {
      return typeof userId !== 'undefined' ? userApi.v1UsersUserIdGet({ userId }) : skipToken;
    },
  });
};

export default useGetUserById;
