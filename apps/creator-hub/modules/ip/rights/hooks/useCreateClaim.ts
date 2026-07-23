import { rightsClient } from '@modules/clients';
import { useMutation } from '@tanstack/react-query';
import { ClaimContent, ClaimItem, ClaimItemStatusEnum } from '@rbx/clients/rightsV1';
import { TakedownRequest } from '../components/createRemovalRequest/CreateRemovalRequestContainer';
import { createDocumentsFromMap } from './document';

const DefaultId = '00000000-0000-0000-0000-000000000000';

export type CreateClaimItemsData = {
  accountId: string;
  userId: string;
  snapshotId?: string;
  description: string;
  takedownRequests: TakedownRequest[];
};

export default function useCreateClaim() {
  const createHandler = async (data: CreateClaimItemsData) => {
    const documents = new Map<string, File>();
    data.takedownRequests.forEach((request) => {
      request.supportingFiles.forEach((file) => {
        if (!file.file || documents.has(file.key)) return;
        documents.set(file.key, file.file);
      });
    });
    const docKeysToIds: Map<string, string> = await createDocumentsFromMap(documents);
    const claimItems: Array<ClaimItem> = await Promise.all(
      data.takedownRequests.map(async (request) => {
        // Create documents
        const fileKeys = request.supportingFiles
          .filter((file) => file.file !== undefined)
          .map((file) => file.key);
        const documentIds: Array<string> = fileKeys
          .map((key) => docKeysToIds.get(key))
          .filter((docId) => docId !== undefined) as Array<string>;
        // Create claim content
        let originalContent: ClaimContent | null = null;
        if (request.myContent) {
          originalContent = {
            claimId: DefaultId,
            claimItemId: DefaultId,
            contentId: request.myContent?.contentId?.toString(),
            contentType: request.myContent?.contentType,
            url: request.myContent.originalLink,
          };
        }
        const infringingContent: ClaimContent = {
          claimId: DefaultId,
          claimItemId: DefaultId,
          contentId: request.infringingContent.contentId.toString(),
          contentType: request.infringingContent.contentType,
          url: request.infringingContent.originalLink,
        };

        return {
          source: request.creationSource,
          claimId: DefaultId,
          contents: [infringingContent],
          originalDocumentIds: documentIds,
          notes: request.description,
          status: ClaimItemStatusEnum.Pending,
          discoveredFrom: request.discoveredFrom,
          ...(originalContent && { content: originalContent }),
        };
      }),
    );
    return rightsClient.createClaim(
      data.accountId,
      data.userId,
      data.description,
      [],
      claimItems,
      data.snapshotId,
    );
  };
  const mutation = useMutation({
    mutationFn: createHandler,
  });

  return mutation;
}
