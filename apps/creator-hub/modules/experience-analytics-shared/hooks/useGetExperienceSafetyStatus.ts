import { useQuery } from '@tanstack/react-query';
import { placeSafetyStatusApi } from '@modules/clients';
import { useExperienceAnalyticsGameDetails } from '../context/ExperienceAnalyticsGameDetailsProvider';
import { ExperienceSafetyStatus } from '../enums/ExperienceSafetyStatus';

const ASSET_MODERATION_STATUS_QUERY_KEY = 'contentSafetyProxy/getAssetModerationStatus';

const useGetExperienceSafetyStatus = (): ExperienceSafetyStatus | undefined => {
  const { rootPlaceId } = useExperienceAnalyticsGameDetails();

  const { data } = useQuery({
    queryKey: [ASSET_MODERATION_STATUS_QUERY_KEY, rootPlaceId],
    queryFn: async (): Promise<ExperienceSafetyStatus> => {
      if (!rootPlaceId) return ExperienceSafetyStatus.Green;

      const response = await placeSafetyStatusApi.getPlaceSafetyStatusById(rootPlaceId);
      const { placeSafetyStatus } = response;

      if (!placeSafetyStatus) {
        return ExperienceSafetyStatus.Green;
      }

      const { userPlayabilityRestrictions, discoveryBlocked } = placeSafetyStatus;

      if (userPlayabilityRestrictions === 'RestrictedForAll') {
        return ExperienceSafetyStatus.Red;
      }

      if (userPlayabilityRestrictions === 'RestrictedToOwner') {
        return ExperienceSafetyStatus.Orange;
      }

      if (discoveryBlocked === true) {
        return ExperienceSafetyStatus.Yellow;
      }

      // no restrictions
      return ExperienceSafetyStatus.Green;
    },
    enabled: !!rootPlaceId,
  });

  return data;
};
export default useGetExperienceSafetyStatus;
