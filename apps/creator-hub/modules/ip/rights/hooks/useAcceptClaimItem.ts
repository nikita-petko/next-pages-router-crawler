import { useMutation } from '@tanstack/react-query';
import rightsClient from '@modules/clients/rights';

export type AcceptClaimItemData = {
  accountId: string;
  claimId: string;
  claimItemId: string;
};

export default function useAcceptClaimItem() {
  const submitHandler = async (data: AcceptClaimItemData) => {
    return rightsClient.acceptClaimItem(data.accountId, data.claimId, data.claimItemId);
  };

  const mutation = useMutation({
    mutationFn: submitHandler,
  });

  return mutation;
}
