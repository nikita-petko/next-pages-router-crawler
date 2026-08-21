import { skipToken, useQuery } from '@tanstack/react-query';
import getUserById from './userRequest';

const useGetUserById = (userId?: number) => {
  return useQuery({
    queryKey: ['User', userId],
    queryFn: () => {
      return typeof userId !== 'undefined' ? getUserById(userId) : skipToken;
    },
  });
};

export default useGetUserById;
