import { rightsClient } from '@modules/clients';
import { useQuery } from '@tanstack/react-query';

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
