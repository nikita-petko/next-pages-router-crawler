import { useQuery } from '@tanstack/react-query';
import developClient from '@modules/clients/develop';

type UseGetShowcaseExperienceDetailsParams = {
  universeIds: number[];
  enabled: boolean;
};

const useGetShowcaseExperienceDetails = ({
  universeIds,
  enabled,
}: UseGetShowcaseExperienceDetailsParams) =>
  useQuery({
    queryKey: ['developClient/getUniversesDetails', 'showcase', universeIds],
    queryFn: () => developClient.getUniversesDetails(universeIds),
    enabled: enabled && universeIds.length > 0,
  });

export default useGetShowcaseExperienceDetails;
