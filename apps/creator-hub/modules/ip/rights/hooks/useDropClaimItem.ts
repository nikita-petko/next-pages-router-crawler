import { useMutation } from '@tanstack/react-query';
import rightsClient from '@modules/clients/rights';

export type DropClaimItemData = {
  accountId: string;
  claimId: string;
  claimItemId: string;
};

export default function useDropClaimItem(onSuccess: () => void, onError: () => void) {
  const submitHandler = async (data: DropClaimItemData) => {
    return rightsClient.dropClaimItem(data.accountId, data.claimId, data.claimItemId);
  };

  const mutation = useMutation({
    mutationFn: submitHandler,
    onSuccess,
    onError,
  });

  return mutation;
}
