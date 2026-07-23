import { useQuery } from '@tanstack/react-query';
import rightsClient from '@modules/clients/rights';

export const useCheckAge = () => {
  const response = useQuery({
    queryKey: ['rightsClient/checkAge'],
    queryFn: async () => {
      return rightsClient.checkAge();
    },
  });
  return { success: !!response.data?.success, ...response };
};

export default useCheckAge;
