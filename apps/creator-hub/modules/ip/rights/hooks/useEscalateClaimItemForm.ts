import { rightsClient } from '@modules/clients';
import { EscalateClaimItemRequest } from '@rbx/clients/rightsV1';
import { useMutation } from '@tanstack/react-query';
import createDocuments from './document';
import { EscalateFormFields } from '../components/claimItem/ActionFormContent/EscalateForm';

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
    const filteredFiles = files.filter((file) => file !== undefined) as Array<File>;
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
