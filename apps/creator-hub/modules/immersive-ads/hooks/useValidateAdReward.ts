import { useQuery } from '@tanstack/react-query';
import adsRewardServiceClient from '@modules/clients/adsRewardService';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';

const useValidateAdReward = (productId: number | null) => {
  const { id: universeId } = useUniverseResource();
  const numericProductId = productId ?? 0;
  const isEnabled = numericProductId > 0;
  const { data, isError, isFetching, refetch } = useQuery({
    queryKey: ['immersive-ads', 'validate-ad-reward', universeId, numericProductId],
    queryFn: () =>
      adsRewardServiceClient.validateAdReward({
        validateAdRewardRequest: { universeId, productId: numericProductId },
      }),
    enabled: isEnabled,
    retry: false,
  });

  return {
    data,
    isError,
    refetch,
    isValidating: productId != null && productId > 0 && isFetching,
  };
};

export default useValidateAdReward;
