import { useQuery } from '@tanstack/react-query';
import loadExperienceDetails from '../utils/loadExperienceDetails';

export const getExperienceDetailsKey = 'developClient/getUniverseDetails';

interface GetExperienceDetailsParams {
  experienceId: number | undefined;
}

export const useGetExperienceDetails = ({ experienceId }: GetExperienceDetailsParams) => {
  return useQuery({
    queryKey: [getExperienceDetailsKey, experienceId],
    queryFn: async () => {
      if (!experienceId) {
        throw new Error('Invalid experienceId');
      }
      const response = await loadExperienceDetails(experienceId);
      return response;
    },
    enabled: !!experienceId,
  });
};

export default useGetExperienceDetails;
