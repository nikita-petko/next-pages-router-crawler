import { useQuery } from '@tanstack/react-query';
import usersClient from '@modules/clients/users';

export const getExperimentCreatorQueryKey = (createdBy?: string) => [
  'get-experiment-creator',
  createdBy,
];

const useExperimentCreator = (createdBy?: string) => {
  return useQuery({
    queryKey: getExperimentCreatorQueryKey(createdBy),
    queryFn: () => {
      if (!createdBy) {
        throw new Error('Experiment creator id is required');
      }
      return usersClient.getUserById(Number(createdBy));
    },
    enabled: !!createdBy,
  });
};

export default useExperimentCreator;
