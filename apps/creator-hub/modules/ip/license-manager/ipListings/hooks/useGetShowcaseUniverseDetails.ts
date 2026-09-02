import { useQuery } from '@tanstack/react-query';
import developClient from '@modules/clients/develop';
import { GET_SHOWCASE_UNIVERSE_DETAILS_QUERY_KEY } from '../../queryKeys';

const MAX_BATCH_SIZE = 100;

type UseGetShowcaseUniverseDetailsParams = {
  universeIds: number[];
  enabled?: boolean;
};

const getShowcaseUniverseDetails = async (universeIds: number[]) => {
  const batches = Array.from(
    { length: Math.ceil(universeIds.length / MAX_BATCH_SIZE) },
    (_, batchIndex) =>
      universeIds.slice(batchIndex * MAX_BATCH_SIZE, (batchIndex + 1) * MAX_BATCH_SIZE),
  );
  const responses = await Promise.all(
    batches.map((batch) => developClient.getUniversesDetails(batch)),
  );

  return {
    data: responses.flatMap((response) => response.data ?? []),
  };
};

const useGetShowcaseUniverseDetails = ({
  universeIds,
  enabled = true,
}: UseGetShowcaseUniverseDetailsParams) =>
  useQuery({
    queryKey: GET_SHOWCASE_UNIVERSE_DETAILS_QUERY_KEY(universeIds),
    queryFn: () => getShowcaseUniverseDetails(universeIds),
    enabled: enabled && universeIds.length > 0,
  });

export default useGetShowcaseUniverseDetails;
