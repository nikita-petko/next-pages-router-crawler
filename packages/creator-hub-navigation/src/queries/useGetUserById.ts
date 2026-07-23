import { skipToken, useQuery } from '@tanstack/react-query';
import { Configuration } from '@rbx/clients-core';
import { UsersApi } from '@rbx/client-users/v1';
import { useMemo } from 'react';
import { getBEDEV1ServiceBasePath } from '../utils/getBasePaths';
import useNavigationConfigs from '../hooks/useNavigationConfigs';

const useGetUserById = (userId?: number) => {
  const { target, robloxEnvironment: environment } = useNavigationConfigs();
  const userApi = useMemo(() => {
    const basePath = getBEDEV1ServiceBasePath('users', target, environment);

    const configuration = new Configuration({
      basePath,
      credentials: 'include',
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
