import { useQuery } from '@tanstack/react-query';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import loadExperienceDetails from '../utils/loadExperienceDetails';

export const getExperienceDetailsKey = 'developClient/getUniverseDetails';

interface GetExperienceDetailsParams {
  experienceId: number | undefined;
}

export const useGetExperienceDetails = ({ experienceId }: GetExperienceDetailsParams) => {
  const {
    params: { enableAudiencesReplacement },
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);
  const audiencesReplacementOn = enableAudiencesReplacement === true;
  return useQuery({
    queryKey: [getExperienceDetailsKey, experienceId, audiencesReplacementOn],
    queryFn: async () => {
      if (!experienceId) {
        throw new Error('Invalid experienceId');
      }
      const response = await loadExperienceDetails(experienceId, audiencesReplacementOn);
      return response;
    },
    enabled: !!experienceId,
  });
};

export default useGetExperienceDetails;
