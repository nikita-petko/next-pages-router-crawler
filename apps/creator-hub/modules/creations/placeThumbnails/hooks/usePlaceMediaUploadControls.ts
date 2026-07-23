import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { getUniverseConfiguration } from '@modules/react-query/develop/universeApiRequest';
import { isPrivateAudience } from '../../common/audiences';
import useGetPlaceMediaQuery from './useGetPlaceMediaQuery';

export const maxThumbnailsOnEDP = 10;

type UsePlaceMediaUploadControlsResult = {
  hasExceededMaxThumbnails: boolean;
  isAuthorizedToConfigure: boolean | undefined;
  isExperiencePrivate: boolean;
  isLoading: boolean;
  isPlaceMediaLoading: boolean;
};

const usePlaceMediaUploadControls = (
  placeId?: number,
  userId?: number,
  universeId?: number,
): UsePlaceMediaUploadControlsResult => {
  const hasPlaceMediaParams = !!placeId && !!userId;
  const {
    params: { enableAudiencesReplacement },
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);
  const audiencesReplacementOn = enableAudiencesReplacement === true;

  const { data: isExperiencePrivateData, isPending: isPrivacyQueryPending } = useQuery({
    queryKey: ['getUniversePrivacyType', universeId, audiencesReplacementOn],
    queryFn: async () => {
      if (!universeId) {
        return false;
      }
      const universeConfig = await getUniverseConfiguration(universeId);
      if (audiencesReplacementOn) {
        return isPrivateAudience(universeConfig?.audiences);
      }
      return universeConfig?.privacyType === 'Private';
    },
    enabled: !!universeId,
  });

  const {
    data: medias,
    failureReason,
    isPending: isPlaceMediaPending,
  } = useGetPlaceMediaQuery(placeId ?? 0, userId ?? 0);

  const isPlaceMediaLoading = hasPlaceMediaParams ? isPlaceMediaPending : false;
  const [isAuthorizedToConfigure, setIsAuthorizedToConfigure] = useState<boolean | undefined>();

  useEffect(() => {
    if (!hasPlaceMediaParams) {
      setIsAuthorizedToConfigure(undefined);
      return;
    }

    if (isPlaceMediaLoading) {
      setIsAuthorizedToConfigure(undefined);
      return;
    }

    void tryParseResponseError(failureReason).then((error) => {
      if (error) {
        // TODO(tyin): use PlacesError enum after moving this component to creations
        setIsAuthorizedToConfigure(error.code !== 2);
      } else {
        setIsAuthorizedToConfigure(true);
      }
    });
  }, [failureReason, hasPlaceMediaParams, isPlaceMediaLoading]);

  const isExperiencePrivate = isExperiencePrivateData === true;
  const hasExceededMaxThumbnails = (medias?.length ?? 0) >= maxThumbnailsOnEDP;

  const isPrivacyLoading = !!universeId && isPrivacyQueryPending;
  const isAuthorizationLoading = hasPlaceMediaParams && isAuthorizedToConfigure === undefined;

  return {
    hasExceededMaxThumbnails,
    isAuthorizedToConfigure,
    isExperiencePrivate,
    isPlaceMediaLoading,
    isLoading: isPlaceMediaLoading || isPrivacyLoading || isAuthorizationLoading,
  };
};

export default usePlaceMediaUploadControls;
