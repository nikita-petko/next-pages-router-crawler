import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Configuration } from '@rbx/clients-core';
import { useRobloxAuthentication as useAuthentication } from '@rbx/auth';
import { GroupsApi, GroupListSurface } from '@rbx/client-creator-home-api/v1';
import { getBEDEV2ServiceBasePathV2 } from '../utils/getBasePaths';
import useNavigationConfigs from '../hooks/useNavigationConfigs';

const useGetGroupsList = () => {
  const { target, robloxEnvironment: environment } = useNavigationConfigs();
  const { user } = useAuthentication();
  const groupsApi = useMemo(() => {
    const basePath = getBEDEV2ServiceBasePathV2('creator-home-api', target, environment);

    const configuration = new Configuration({
      basePath,
      credentials: 'include',
    });

    return new GroupsApi(configuration);
  }, [environment, target]);

  return useQuery({
    queryKey: ['creatorHome', 'groupList'],
    enabled: !!user,
    queryFn: () => {
      return groupsApi.groupsListGroups({
        surface: GroupListSurface.CreatorHub,
      });
    },
  });
};

export default useGetGroupsList;
