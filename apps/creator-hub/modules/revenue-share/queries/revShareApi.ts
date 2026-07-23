// Configures the revenue share service client and exposes normalized manager, recipient, proposal, cancellation, and response operations.
import { CreatorRevenueShareServiceAPIApi } from '@rbx/client-creator-revenue-share-api/v1';
import { getResponseFromError } from '@modules/clients/utils';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';
import SecureRedirectMiddleware from '@modules/clients/utils/SecureRedirectMiddleware';
import {
  RevShareRecipientType,
  RevShareResult,
  RevShareTargetType,
} from '../interface/RevShareViewModel';
import type {
  ManagerAgreement,
  RecipientAgreement,
  RevShareAcceptOrDecline,
  RevShareProposeResult,
  RevShareRecipient,
  RevShareRecipientAllocation,
  RevShareTarget,
} from '../interface/RevShareViewModel';
import { asNumberTypedId } from '../utils/revShareUtils';
import {
  emptyManagerAgreement,
  mapAcceptOrDecline,
  mapManagerView,
  mapRecipientAllocations,
  mapRecipientView,
  mapResult,
  mapTargetWrite,
} from '../utils/revShareViewMapper';

const configuration = createClientConfiguration('creator-revenue-share-api', 'bedev2', {
  middleware: [new SecureRedirectMiddleware()],
});

const client = new CreatorRevenueShareServiceAPIApi(configuration);

const assertSucceeded = (result: string | undefined): void => {
  const mapped = mapResult(result);
  if (mapped !== RevShareResult.Succeeded) {
    throw new Error(mapped);
  }
};

/* public reads */

export const getRevShareForManager = async (
  managingGroupId: string,
): Promise<ManagerAgreement[]> => {
  const data = await client.v1beta1ManagerGroupsManagingGroupIdRevSharesGet({
    managingGroupId: asNumberTypedId(managingGroupId),
  });
  assertSucceeded(data.result);
  return (data.views ?? []).map(mapManagerView);
};

export const getRevShareByTarget = async (target: RevShareTarget): Promise<ManagerAgreement> => {
  try {
    const data =
      target.type === RevShareTargetType.Experience
        ? await client.v1beta1TargetsExperienceTargetExperienceIdRevShareGet({
            targetExperienceId: asNumberTypedId(target.id),
          })
        : await client.v1beta1TargetsUgcTargetUgcIdRevShareGet({
            targetUgcId: target.id,
          });

    if (mapResult(data.result) === RevShareResult.NotFound) {
      return emptyManagerAgreement(target);
    }
    assertSucceeded(data.result);
    return data.view ? mapManagerView(data.view) : emptyManagerAgreement(target);
  } catch (err) {
    if (getResponseFromError(err)?.status === 404) {
      return emptyManagerAgreement(target);
    }
    throw err;
  }
};

export const getRevShareForRecipient = async (
  recipientRef: RevShareRecipient,
): Promise<RecipientAgreement[]> => {
  const data =
    recipientRef.type === RevShareRecipientType.User
      ? await client.v1beta1RecipientUsersRecipientIdUserIdRevSharesGet({
          recipientIdUserId: asNumberTypedId(recipientRef.id),
        })
      : await client.v1beta1RecipientGroupsRecipientIdGroupIdRevSharesGet({
          recipientIdGroupId: asNumberTypedId(recipientRef.id),
        });
  assertSucceeded(data.result);
  return (data.views ?? []).map(mapRecipientView);
};

/* manager writes */

// helper for proposeRevShareChange and proposeRevShareAllocateUnallocated
const proposeRevShareChangeHelper = async (
  target: RevShareTarget,
  activeRevShareId: string | null,
  allocations: RevShareRecipientAllocation[],
  allocateUnallocated: boolean,
): Promise<RevShareProposeResult> => {
  const proposeChangeRequest = {
    target: mapTargetWrite(target),
    recipients: mapRecipientAllocations(allocations),
    expectedActiveAgreementId: asNumberTypedId(activeRevShareId ?? '0'),
  };

  const data =
    target.type === RevShareTargetType.Experience
      ? allocateUnallocated
        ? await client.v1beta1TargetsExperienceTargetExperienceIdRevShareProposeAllocateUnallocatedPost(
            {
              targetExperienceId: asNumberTypedId(target.id),
              proposeAllocateUnallocatedRequest: proposeChangeRequest,
            },
          )
        : await client.v1beta1TargetsExperienceTargetExperienceIdRevShareProposeChangePost({
            targetExperienceId: asNumberTypedId(target.id),
            proposeChangeRequest,
          })
      : allocateUnallocated
        ? await client.v1beta1TargetsUgcTargetUgcIdRevShareProposeAllocateUnallocatedPost({
            targetUgcId: target.id,
            proposeAllocateUnallocatedRequest: proposeChangeRequest,
          })
        : await client.v1beta1TargetsUgcTargetUgcIdRevShareProposeChangePost({
            targetUgcId: target.id,
            proposeChangeRequest,
          });

  const result = mapResult(data.result);
  return result === RevShareResult.Succeeded
    ? { updateSucceeded: true }
    : { updateSucceeded: false, result };
};

export const proposeRevShareChange = async (
  target: RevShareTarget,
  activeRevShareId: string | null,
  allocations: RevShareRecipientAllocation[],
): Promise<RevShareProposeResult> => {
  return proposeRevShareChangeHelper(target, activeRevShareId, allocations, false);
};

export const proposeRevShareAllocateUnallocated = async (
  target: RevShareTarget,
  activeRevShareId: string | null,
  allocations: RevShareRecipientAllocation[],
): Promise<RevShareProposeResult> => {
  return proposeRevShareChangeHelper(target, activeRevShareId, allocations, true);
};

export const cancelRevShareProposal = async (proposedRevShareId: string): Promise<void> => {
  const data = await client.v1beta1RevShareProposalsProposedAgreementIdCancelPost({
    proposedAgreementId: asNumberTypedId(proposedRevShareId),
  });
  assertSucceeded(data.result);
};

/* recipient writes */

export const respondToRevShareProposal = async (args: {
  proposedRevShareId: string;
  recipientRef: RevShareRecipient;
  response: RevShareAcceptOrDecline;
}): Promise<void> => {
  const response = mapAcceptOrDecline(args.response);
  const data =
    args.recipientRef.type === RevShareRecipientType.Group
      ? await client.v1beta1RevShareProposalsProposedAgreementIdRespondGroupRecipientIdGroupIdPost({
          proposedAgreementId: asNumberTypedId(args.proposedRevShareId),
          recipientIdGroupId: asNumberTypedId(args.recipientRef.id),
          respondToProposalRequest: { response },
        })
      : await client.v1beta1RevShareProposalsProposedAgreementIdRespondUserRecipientIdUserIdPost({
          proposedAgreementId: asNumberTypedId(args.proposedRevShareId),
          recipientIdUserId: asNumberTypedId(args.recipientRef.id),
          respondToProposalRequest: { response },
        });
  assertSucceeded(data.result);
};
