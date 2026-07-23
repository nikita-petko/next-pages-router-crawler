import { useQuery } from '@tanstack/react-query';
import { talentSignalsApi } from '../api/talentHubClient';
import { th2QueryKeys } from '../queryKeys';
import type { TalentSignalResponse } from '../types';
import { isMocksEnabled } from '../utils';

export function useTalentSignal(variant: 'self' | 'application', applicationId: string | null) {
  const mocks = isMocksEnabled();

  return useQuery<TalentSignalResponse>({
    queryKey: th2QueryKeys.talentSignals.detail(variant, applicationId, mocks),
    queryFn: async () => {
      if (mocks) {
        await (await import('../mocks/mockUtils')).mockRequestTimeTaken();
        if (variant === 'self') {
          return (await import('../mocks/mockData')).MOCK_TALENT_SIGNAL_SELF_RESPONSE;
        }
        return (await import('../mocks/mockData')).MOCK_TALENT_SIGNAL_APPLICATION_RESPONSE;
      }

      if (variant === 'self') {
        return talentSignalsApi.apiTalentSignalsSelfGet();
      }
      if (variant === 'application' && applicationId !== null) {
        return talentSignalsApi.apiTalentSignalsApplicationApplicationIdGet({ applicationId });
      }
      return null;
    },
    staleTime: 60 * 60 * 1000, // 1 hr
  });
}

export default useTalentSignal;
