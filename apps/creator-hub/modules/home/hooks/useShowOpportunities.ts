import { useMemo } from 'react';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import useGetSignals from '@modules/react-query/creatorHome/useGetSignals';

const useShowOpportunities = (): { show: boolean; isFetched: boolean } => {
  const {
    params: { alwaysShow, enableSignalLookup },
    isFetched: isFetchedIXP,
  } = useIXPParameters(IXPLayers.CreatorHubHomePageOpportunitiesSection);

  const enableSignalsQuery = isFetchedIXP && !alwaysShow && !!enableSignalLookup;
  const { data: signals, isFetched: isFetchedSignals } = useGetSignals(enableSignalsQuery);

  return useMemo(() => {
    if (!isFetchedIXP) {
      return { show: false, isFetched: false };
    }
    if (alwaysShow) {
      return { show: true, isFetched: true };
    }
    if (!enableSignalLookup) {
      return { show: false, isFetched: true };
    }
    return { show: isFetchedSignals && !!signals?.opportunities, isFetched: isFetchedSignals };
  }, [isFetchedIXP, alwaysShow, enableSignalLookup, isFetchedSignals, signals]);
};

export default useShowOpportunities;
