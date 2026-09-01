import { useMutation } from '@tanstack/react-query';
import type { DisputeClaimItemRequest } from '@rbx/client-rights/v1';
import rightsClient from '@modules/clients/rights';
import type { DisputeFormFields } from '../components/claimItem/ActionFormContent/types';
import createDocuments from './document';

export default function useSubmitDisputeForm(
  accountId: string,
  claimId: string,
  claimItemId: string,
  onSuccess: () => void,
  onError: () => void,
) {
  const submitHandler = async (data: DisputeFormFields) => {
    let documentIds: string[] = [];
    const files: Array<File | undefined> = data.documents.map((file) => file.file);
    const filteredFiles = files.filter((file) => file !== undefined);
    documentIds = await createDocuments(filteredFiles);

    const disputeClaimItemRequest: DisputeClaimItemRequest = {
      reason: data.reason,
      rationaleDescription: data.description,
      rationaleDocumentIds: documentIds,
    };

    return rightsClient.disputeClaimItem(accountId, claimId, claimItemId, disputeClaimItemRequest);
  };
  const mutation = useMutation({
    mutationFn: submitHandler,
    onSuccess,
    onError,
  });

  return mutation;
}
