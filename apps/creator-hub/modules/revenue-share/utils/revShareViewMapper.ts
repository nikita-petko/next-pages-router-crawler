// Normalizes revenue share API payloads into front-end view models and maps front-end values into write request shapes.
import type {
  AcceptOrDecline,
  ManagerRevShareView as ApiManagerRevShareView,
  RecipientAllocation as ApiRecipientAllocation,
  RecipientRevShareView as ApiRecipientRevShareView,
  RecipientSplit as ApiRecipientSplit,
  RevShareRecipientId as ApiRecipientId,
  RevShareSplit as ApiRevShareSplit,
  RevShareTargetRef as ApiTargetRef,
  ConfirmationEntry as ApiConfirmationEntry,
} from '@rbx/client-creator-revenue-share-api/v1';
import {
  REV_SHARE_TOTAL_BASIS_POINTS,
  RevShareAcceptOrDecline,
  RevShareConfirmationStatus,
  RevShareProposalType,
  RevShareRecipientType,
  RevShareResult,
  RevShareTargetType,
} from '../interface/RevShareViewModel';
import type {
  ManagerAgreement,
  RecipientAgreement,
  RecipientProposalChanges,
  RevShareRecipient,
  RevShareRecipientAllocation,
  RevShareRecipientConfirmation,
  RevShareRecipientSplit,
  RevShareSplit,
  RevShareTarget,
} from '../interface/RevShareViewModel';
import { asNumberTypedId, buildManagerProposalDiff } from './revShareUtils';

const DEFAULT_MANAGER_SPLIT: RevShareSplit = {
  recipients: [],
  unallocatedBasisPoints: 0,
  managingGroupBasisPoints: REV_SHARE_TOTAL_BASIS_POINTS,
};

const DEFAULT_RECIPIENT_SPLIT: RevShareRecipientSplit = {
  recipientBasisPoints: 0,
  remainingBasisPoints: REV_SHARE_TOTAL_BASIS_POINTS,
  unallocatedBasisPoints: 0,
};

const computeRecipientProposalChanges = (
  active: RevShareRecipientSplit,
  proposed: RevShareRecipientSplit,
): RecipientProposalChanges => ({
  recipient: {
    fromBasisPoints: active.recipientBasisPoints,
    toBasisPoints: proposed.recipientBasisPoints,
  },
  remaining: {
    fromBasisPoints: active.remainingBasisPoints,
    toBasisPoints: proposed.remainingBasisPoints,
  },
  unallocated: {
    fromBasisPoints: active.unallocatedBasisPoints,
    toBasisPoints: proposed.unallocatedBasisPoints,
  },
});

const mapRecipient = (recipient: ApiRecipientId | undefined): RevShareRecipient => {
  if (recipient?.userId != null) {
    return { type: RevShareRecipientType.User, id: String(recipient.userId) };
  }
  if (recipient?.groupId != null) {
    return { type: RevShareRecipientType.Group, id: String(recipient.groupId) };
  }
  return { type: RevShareRecipientType.User, id: '' };
};

const CONFIRMATION_STATUS: Record<string, RevShareConfirmationStatus> = {
  CONFIRMATION_STATUS_ACCEPTED: RevShareConfirmationStatus.Accepted,
  CONFIRMATION_STATUS_DECLINED: RevShareConfirmationStatus.Declined,
  CONFIRMATION_STATUS_AUTO_ACCEPTED: RevShareConfirmationStatus.AutoAccepted,
  CONFIRMATION_STATUS_SYSTEM_APPLIED: RevShareConfirmationStatus.AutoAccepted,
};

const mapConfirmationStatus = (status: string): RevShareConfirmationStatus =>
  CONFIRMATION_STATUS[status] ?? RevShareConfirmationStatus.Pending;

const mapRecipientConfirmation = (entry: ApiConfirmationEntry): RevShareRecipientConfirmation => ({
  recipient: mapRecipient(entry.recipientId),
  status: mapConfirmationStatus(entry.status ?? ''),
});

const mapAgreementId = (id: number | string | null | undefined): string | null =>
  id == null || String(id) === '0' ? null : String(id);

const mapSplit = (split: ApiRevShareSplit): RevShareSplit => ({
  recipients: (split.recipients ?? []).map((entry) => ({
    recipient: mapRecipient(entry.recipientId),
    splitBasisPoints: entry.splitBps ?? 0,
  })),
  unallocatedBasisPoints: split.unallocatedBps ?? 0,
  managingGroupBasisPoints: split.managingGroupBps ?? 0,
});

const mapRecipientSplit = (split: ApiRecipientSplit): RevShareRecipientSplit => ({
  recipientBasisPoints: split.recipientShareBps ?? 0,
  remainingBasisPoints: split.remainingBps ?? 0,
  unallocatedBasisPoints: split.unallocatedBps ?? 0,
});

const mapTarget = (target: ApiTargetRef | undefined): RevShareTarget => {
  if (target?.experienceId != null) {
    return { type: RevShareTargetType.Experience, id: String(target.experienceId) };
  }
  if (target?.ugcId != null) {
    return { type: RevShareTargetType.Ugc, id: target.ugcId };
  }
  return { type: RevShareTargetType.Experience, id: '' };
};

export const mapManagerView = (view: ApiManagerRevShareView): ManagerAgreement => {
  const splits = view.splits ?? {};
  const activeId = mapAgreementId(view.activeAgreementId);
  const activeSplit =
    activeId != null && splits[activeId] ? mapSplit(splits[activeId]) : DEFAULT_MANAGER_SPLIT;
  const proposedId = mapAgreementId(view.proposedAgreementId);
  const proposedSplit =
    proposedId != null && splits[proposedId] ? mapSplit(splits[proposedId]) : null;

  return {
    target: mapTarget(view.target),
    targetName: view.targetName ?? '',
    activeId,
    active: activeSplit,
    proposed:
      proposedId != null && proposedSplit != null
        ? {
            id: proposedId,
            split: proposedSplit,
            confirmations: (view.confirmations ?? []).map(mapRecipientConfirmation),
            ...buildManagerProposalDiff(activeSplit, proposedSplit),
          }
        : null,
  };
};

export const mapRecipientView = (view: ApiRecipientRevShareView): RecipientAgreement => {
  const splits = view.splits ?? {};
  const activeSplit = view.activeSplit
    ? mapRecipientSplit(view.activeSplit)
    : DEFAULT_RECIPIENT_SPLIT;
  const proposedId = mapAgreementId(view.proposedAgreementId);
  const proposedSplit =
    proposedId != null && splits[proposedId] ? mapRecipientSplit(splits[proposedId]) : null;

  return {
    target: mapTarget(view.target),
    targetName: view.targetName ?? '',
    active: activeSplit,
    proposed:
      proposedId != null && proposedSplit != null
        ? {
            id: proposedId,
            type: RevShareProposalType.Edit,
            split: proposedSplit,
            confirmation: view.recipientProposalStatus
              ? mapConfirmationStatus(view.recipientProposalStatus)
              : RevShareConfirmationStatus.Pending,
            changes: computeRecipientProposalChanges(activeSplit, proposedSplit),
          }
        : null,
  };
};

export const emptyManagerAgreement = (target: RevShareTarget): ManagerAgreement => ({
  target,
  targetName: '',
  activeId: null,
  active: DEFAULT_MANAGER_SPLIT,
  proposed: null,
});

const RESULT: Record<string, RevShareResult> = {
  REV_SHARE_RESULT_INVALID: RevShareResult.Invalid,
  REV_SHARE_RESULT_SUCCEEDED: RevShareResult.Succeeded,
  REV_SHARE_RESULT_NOT_FOUND: RevShareResult.NotFound,
  REV_SHARE_RESULT_RECIPIENT_NOT_FOUND: RevShareResult.RecipientNotFound,
  REV_SHARE_RESULT_DUPLICATE_RECIPIENT: RevShareResult.DuplicateRecipient,
  REV_SHARE_RESULT_SPLIT_SUM_INVALID: RevShareResult.SplitSumInvalid,
  REV_SHARE_RESULT_RECIPIENT_NOT_GROUP_MEMBER: RevShareResult.RecipientNotGroupMember,
  REV_SHARE_RESULT_RECIPIENT_IS_MANAGING_GROUP: RevShareResult.RecipientIsManagingGroup,
  REV_SHARE_RESULT_PROPOSAL_ALREADY_EXISTS: RevShareResult.ProposalAlreadyExists,
  REV_SHARE_RESULT_NO_OPEN_PROPOSAL: RevShareResult.NoOpenProposal,
  REV_SHARE_RESULT_RECIPIENT_ALREADY_RESPONDED: RevShareResult.RecipientAlreadyResponded,
  REV_SHARE_RESULT_UNAUTHORIZED: RevShareResult.Unauthorized,
  REV_SHARE_RESULT_2FA_FAILED: RevShareResult.TwoFaFailed,
  REV_SHARE_RESULT_RECIPIENT_LIMIT_EXCEEDED: RevShareResult.RecipientLimitExceeded,
  REV_SHARE_RESULT_STALE_ACTIVE_AGREEMENT: RevShareResult.StaleActiveAgreement,
};

export const mapResult = (result: string | undefined): RevShareResult =>
  (result != null ? RESULT[result] : undefined) ?? RevShareResult.Invalid;

export const mapTargetWrite = (target: RevShareTarget): ApiTargetRef =>
  target.type === RevShareTargetType.Experience
    ? { experienceId: asNumberTypedId(target.id) }
    : { ugcId: target.id };

const mapRecipientId = (r: RevShareRecipient): ApiRecipientId =>
  r.type === RevShareRecipientType.Group
    ? { groupId: asNumberTypedId(r.id) }
    : { userId: asNumberTypedId(r.id) };

export const mapRecipientAllocations = (
  allocations: RevShareRecipientAllocation[],
): ApiRecipientAllocation[] =>
  allocations
    .filter((a) => a.splitBasisPoints > 0)
    .map((a) => ({ recipientId: mapRecipientId(a.recipient), splitBps: a.splitBasisPoints }));

export const mapAcceptOrDecline = (response: RevShareAcceptOrDecline): AcceptOrDecline =>
  response === RevShareAcceptOrDecline.Accept
    ? 'ACCEPT_OR_DECLINE_ACCEPT'
    : 'ACCEPT_OR_DECLINE_DECLINE';
