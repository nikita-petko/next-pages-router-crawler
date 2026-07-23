import { useQuery } from '@tanstack/react-query';
import { Configuration } from '@rbx/clients-core';
import { LocaleApi } from '@rbx/client-locale/v1';
import { useMemo } from 'react';
import { getBEDEV1ServiceBasePath } from '../utils/getBasePaths';
import useNavigationConfigs from '../hooks/useNavigationConfigs';

const useGetUserLocalizationLocusSupportedLocales = () => {
  const { target, robloxEnvironment: environment } = useNavigationConfigs();
  const localeApi = useMemo(() => {
    const basePath = getBEDEV1ServiceBasePath('locale', target, environment);

    const configuration = new Configuration({
      basePath,
      credentials: 'include',
    });

    return new LocaleApi(configuration);
  }, [environment, target]);

  return useQuery({
    queryKey: ['locale', 'supportedLocalesForCreators'],
    queryFn: () => {
      return localeApi.v1LocalesUserLocalizationLocusSupportedLocalesGet();
    },
  });
};

export default useGetUserLocalizationLocusSupportedLocales;
