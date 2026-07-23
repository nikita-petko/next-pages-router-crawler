import { useMemo } from 'react';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import DataSharingQueryParams from '../enums/DataSharingQueryParams';
import DataSharingTabKey from '../enums/DataSharingTabKey';

const useTabQueryParam = (): [DataSharingTabKey | null, (newTab: DataSharingTabKey) => void] => {
  const [{ tab }, setTabQueryParamRaw] = useQueryParams([DataSharingQueryParams.Tab]);
  const currentTab = useMemo(() => {
    const tabFromParams = Array.isArray(tab) ? tab[0] : tab;
    if (
      tabFromParams &&
      Object.values(DataSharingTabKey).includes(tabFromParams as DataSharingTabKey)
    ) {
      return tabFromParams as DataSharingTabKey;
    }
    return null;
  }, [tab]);

  const setTabQueryParam = (newTab: DataSharingTabKey) => {
    setTabQueryParamRaw({ [DataSharingQueryParams.Tab]: newTab });
  };

  return [currentTab, setTabQueryParam];
};

export default useTabQueryParam;
