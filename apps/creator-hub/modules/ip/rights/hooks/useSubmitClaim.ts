import { rightsClient } from '@modules/clients';
import { useMutation } from '@tanstack/react-query';

export type SubmitClaimData = {
  accountId: string;
  claimId: string;
};

export default function useSubmitClaim() {
  const submitHandler = async (data: SubmitClaimData) => {
    return rightsClient.submitClaim(data.accountId, data.claimId);
  };
  const mutation = useMutation({
    mutationFn: submitHandler,
  });

  return mutation;
}
