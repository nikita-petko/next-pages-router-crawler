import { rightsClient } from '@modules/clients';
import { DisputeClaimItemRequest } from '@rbx/clients/rightsV1';
import { useMutation } from '@tanstack/react-query';
import createDocuments from './document';
import { DisputeFormFields } from '../components/claimItem/ActionFormContent/DisputeForm';

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
    const filteredFiles = files.filter((file) => file !== undefined) as Array<File>;
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
