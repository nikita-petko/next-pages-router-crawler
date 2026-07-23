// Defines normalized front-end revenue share agreement targets, recipients, splits, proposals, confirmations, and operation results.
import type { ThumbnailWithNamesProps } from '@modules/miscellaneous/components/ThumbnailWithNames';

export enum RevShareTargetType {
  Experience = 'experience',
  Ugc = 'ugc',
}

export type RevShareTarget = {
  type: RevShareTargetType;
  id: string;
};

export enum RevShareRecipientType {
  User = 'user',
  Group = 'group',
}

export type RevShareRecipient = {
  type: RevShareRecipientType;
  id: string;
};

export type ResolvedRevShareParty = {
  target: ThumbnailWithNamesProps['target'];
  targetType: ThumbnailWithNamesProps['targetType'];
  name: string;
};

export type RevShareRecipientSearchResult = RevShareRecipient & {
  name: string;
  subtitle?: string;
  username?: string;
};

export enum RevShareConfirmationStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Declined = 'declined',
  AutoAccepted = 'autoAccepted',
}

export enum RevShareAcceptOrDecline {
  Accept = 'accept',
  Decline = 'decline',
}

export enum RevShareProposalType {
  Edit = 'edit',
  AllocateUnallocated = 'allocateUnallocated',
}

export const BASIS_POINTS_PER_PERCENT = 100;
export const REV_SHARE_TOTAL_BASIS_POINTS = 10_000;

// Split values are integer basis points (1 bp = 0.01%); format and parse them at UI boundaries.

export type RevShareRecipientAllocation = {
  recipient: RevShareRecipient;
  splitBasisPoints: number;
};

export type RevShareSplit = {
  recipients: RevShareRecipientAllocation[];
  unallocatedBasisPoints: number;
  ownerBasisPoints: number; // Total minus recipients and unallocated basis points.
};

/** Recipient projection exposing only the recipient share and aggregate remaining allocation. */
export type RevShareRecipientSplit = {
  recipientBasisPoints: number;
  remainingBasisPoints: number;
  unallocatedBasisPoints: number;
};

export type RevShareRecipientConfirmation = {
  recipient: RevShareRecipient;
  status: RevShareConfirmationStatus;
};

export type RevShareAllocationChange = {
  fromBasisPoints: number;
  toBasisPoints: number;
};

export type RevShareRecipientAllocationChange = RevShareAllocationChange & {
  recipient: RevShareRecipient;
  isAddition: boolean;
  isRemoval: boolean;
};

export type ManagerProposalChanges = {
  recipientChangesInStableDisplayOrder: RevShareRecipientAllocationChange[];
  owner: RevShareAllocationChange;
  unallocated: RevShareAllocationChange;
};

export type RecipientProposalChanges = {
  recipient: RevShareAllocationChange;
  remaining: RevShareAllocationChange;
  unallocated: RevShareAllocationChange;
};

/**
 * The open proposal on a manager-visible agreement, null when no proposal is open. Also bundles diffs from the active.
 */
export type ManagerProposal = {
  id: string;
  type: RevShareProposalType;
  split: RevShareSplit;
  confirmations: RevShareRecipientConfirmation[];
  changes: ManagerProposalChanges;
};

/** The open proposal as a recipient sees it (projection). */
export type RecipientProposal = {
  id: string;
  type: RevShareProposalType;
  split: RevShareRecipientSplit;
  confirmation: RevShareConfirmationStatus;
  changes: RecipientProposalChanges;
};

/** A target as the owner/manager sees it: full split plus every recipient's confirmation status. */
export type ManagerAgreement = {
  target: RevShareTarget;
  targetName: string;
  activeId: string | null;
  active: RevShareSplit;
  proposed: ManagerProposal | null;
};

/** A target as a recipient sees it: own share only. */
export type RecipientAgreement = {
  target: RevShareTarget;
  targetName: string;
  active: RevShareRecipientSplit;
  proposed: RecipientProposal | null;
};

export enum RevShareResult {
  Invalid = 'invalid',
  Succeeded = 'succeeded',
  NotFound = 'notFound',
  RecipientNotFound = 'recipientNotFound',
  DuplicateRecipient = 'duplicateRecipient',
  SplitSumInvalid = 'splitSumInvalid',
  RecipientNotGroupMember = 'recipientNotGroupMember',
  RecipientIsManagingGroup = 'recipientIsManagingGroup',
  ProposalAlreadyExists = 'proposalAlreadyExists',
  NoOpenProposal = 'noOpenProposal',
  RecipientAlreadyResponded = 'recipientAlreadyResponded',
  Unauthorized = 'unauthorized',
  TwoFaFailed = 'twoFaFailed',
  RecipientLimitExceeded = 'recipientLimitExceeded',
  StaleActiveAgreement = 'staleActiveAgreement',
}

export type RevShareProposeResult =
  | { updateSucceeded: true }
  | { updateSucceeded: false; result: RevShareResult };
