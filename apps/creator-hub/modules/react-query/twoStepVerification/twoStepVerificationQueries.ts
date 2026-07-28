import { skipToken, useQuery } from '@tanstack/react-query';
import twoStepVerificationClient from '@modules/clients/twostepverification';

const useGetUserConfiguration = (userId?: number) => {
  return useQuery({
    queryKey: ['twoStepVerification', 'getUserConfiguration', userId],
    queryFn:
      typeof userId !== 'undefined'
        ? () => twoStepVerificationClient.getUserConfiguration(userId)
        : skipToken,
  });
};

export default useGetUserConfiguration;
