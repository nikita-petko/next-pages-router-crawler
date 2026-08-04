import { useMutation } from '@tanstack/react-query';
import { getAuthenticatedUserEmail } from '@modules/clients/accountSettings';

export const useCheckEmailEligibility = () =>
  useMutation({
    mutationFn: getAuthenticatedUserEmail,
  });
