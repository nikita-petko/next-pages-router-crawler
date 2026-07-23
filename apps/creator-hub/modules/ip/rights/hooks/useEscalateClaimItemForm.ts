import { useMutation } from '@tanstack/react-query';
import type { EscalateClaimItemRequest } from '@rbx/client-rights/v1';
import rightsClient from '@modules/clients/rights';
import type { EscalateFormFields } from '../components/claimItem/ActionFormContent/types';
import createDocuments from './document';

export default function useEscalateClaimItemForm(
  accountId: string,
  claimId: string,
  claimItemId: string,
  onSuccess: () => void,
  onError: () => void,
) {
  const submitHandler = async (data: EscalateFormFields) => {
    let documentIds: string[] = [];
    const files: Array<File | undefined> = data.documents.map((file) => file.file);
    const filteredFiles = files.filter((file) => file !== undefined);
    documentIds = await createDocuments(filteredFiles);

    const escalateClaimItemRequest: EscalateClaimItemRequest = {
      originalDescription: data.description,
      originalDocumentIds: documentIds,
    };

    return rightsClient.escalateClaimItem(
      accountId,
      claimId,
      claimItemId,
      escalateClaimItemRequest,
    );
  };
  const mutation = useMutation({
    mutationFn: submitHandler,
    onSuccess,
    onError,
  });

  return mutation;
}
