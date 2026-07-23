import { skipToken, useMutation, useQuery } from '@tanstack/react-query';
import developClient from '@modules/clients/develop';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import type { TSetUniverseConfigurationArgs } from './universeApiRequest';
import { getUniverseConfiguration, setUniverseConfigurationV2 } from './universeApiRequest';

export const useGetUniverseConfiguration = (universeId?: number) => {
  return useQuery({
    queryKey: ['universe', universeId],
    queryFn: universeId ? () => getUniverseConfiguration(universeId) : skipToken,
  });
};

export const useSetUniverseConfigurationV2 = () => {
  return useMutation({
    mutationKey: ['universe', 'config'],
    mutationFn: async (args: TSetUniverseConfigurationArgs) => {
      try {
        return setUniverseConfigurationV2(args);
      } catch (error) {
        throw await tryParseResponseError(error);
      }
    },
  });
};

export const useGetActivationEligibilityForUniverse = (universeId?: number) => {
  return useQuery({
    queryKey: ['universe', universeId, 'activationEligibility'],
    queryFn: async () => {
      if (!universeId) {
        return {};
      }
      return developClient.getActivationEligibilityForUniverse(universeId);
    },
    enabled: !!universeId,
  });
};

export const useGetActivationEligibilityForUser = () => {
  return useQuery({
    queryKey: ['user', 'activationEligibility'],
    queryFn: async () => {
      return developClient.getActivationEligibilityForUser();
    },
  });
};
