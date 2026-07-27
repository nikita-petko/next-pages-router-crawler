// Formats, compares, and materializes exact basis-point allocations for revenue share editing.
import {
  BASIS_POINTS_PER_PERCENT,
  REV_SHARE_TOTAL_BASIS_POINTS,
  RevShareConfirmationStatus,
  RevShareProposalType,
  RevShareRecipientType,
} from '../interface/RevShareViewModel';
import type {
  ManagerProposal,
  ManagerProposalChanges,
  RevShareRecipient,
  RevShareRecipientAllocation,
  RevShareRecipientAllocationChange,
  RevShareRecipientConfirmation,
  RevShareSplit,
} from '../interface/RevShareViewModel';

// Runtime int64 identifiers remain strings to avoid precision loss despite the generated numeric type.
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- int64 string → number-typed generated model.
export const asNumberTypedId = (id: string): number => id as unknown as number;

const BASIS_POINT_FRACTION_DIGITS = 2;

// Kept for compatibility with the percent input on the master baseline.
export const PERCENT_FRACTION_DIGITS = BASIS_POINT_FRACTION_DIGITS;

/** Coerce wire/display values to a safe integer basis-point amount. */
export const asSafeBasisPoints = (value: unknown): number => {
  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    return value;
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed)) {
      return parsed;
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const rounded = Math.round(value);
    if (Number.isSafeInteger(rounded)) {
      return rounded;
    }
  }
  return 0;
};

export const formatBasisPoints = (basisPoints: number): string => {
  if (!Number.isSafeInteger(basisPoints)) {
    throw new RangeError('Basis points must be a safe integer.');
  }

  const sign = basisPoints < 0 ? '-' : '';
  const absoluteBasisPoints = Math.abs(basisPoints);
  const wholePercent = Math.trunc(absoluteBasisPoints / BASIS_POINTS_PER_PERCENT);
  const fractionalPercent = absoluteBasisPoints % BASIS_POINTS_PER_PERCENT;

  return `${sign}${wholePercent}.${String(fractionalPercent).padStart(BASIS_POINT_FRACTION_DIGITS, '0')}`;
};

export const formatPreviousSplitDisplay = (basisPoints: number | null): string =>
  `${formatBasisPoints(asSafeBasisPoints(basisPoints))}%`;

export type MaterializeProposedSplitInput = {
  readonly allocations: readonly RevShareRecipientAllocation[];
  readonly activeUnallocatedBasisPoints: number;
};

export const getRevShareRecipientKey = (
  recipient: RevShareRecipient | RevShareRecipientAllocation | { recipient: RevShareRecipient },
): string => {
  const resolved = 'recipient' in recipient ? recipient.recipient : recipient;
  return `${resolved.type}:${resolved.id}`;
};

export const isRevShareCurrentUserRecipient = (
  recipient: Pick<RevShareRecipient, 'type' | 'id'>,
  currentUserId: string | number | null | undefined,
): boolean =>
  currentUserId != null &&
  currentUserId !== '' &&
  recipient.type === RevShareRecipientType.User &&
  recipient.id === String(currentUserId);

export const shouldAutoAcceptProposedAsCurrentUser = (
  confirmations: readonly RevShareRecipientConfirmation[],
  currentUserId: string | number | null | undefined,
): boolean =>
  confirmations.some(
    (confirmation) =>
      confirmation.status === RevShareConfirmationStatus.Pending &&
      isRevShareCurrentUserRecipient(confirmation.recipient, currentUserId),
  );

/** Display-order sort input for recipients (managing group is outside this list). */
export type RevShareStableDisplaySortItem = {
  recipient: Pick<RevShareRecipient, 'type' | 'id'>;
  isAddition: boolean;
  inputIndex: number;
};

/**
 * Stable recipient display order: current user, then remaining additions (by recipient key),
 * then remaining existing (by inputIndex). Key order is shared by editor and review diff.
 */
export const sortRevShareRecipientsForStableDisplay = <T extends RevShareStableDisplaySortItem>(
  items: readonly T[],
  currentUserId: string | number,
): T[] => {
  const currentUserItems: T[] = [];
  const additions: T[] = [];
  const existing: T[] = [];

  for (const item of items) {
    if (isRevShareCurrentUserRecipient(item.recipient, currentUserId)) {
      currentUserItems.push(item);
    } else if (item.isAddition) {
      additions.push(item);
    } else {
      existing.push(item);
    }
  }

  additions.sort((a, b) =>
    getRevShareRecipientKey(a.recipient).localeCompare(getRevShareRecipientKey(b.recipient)),
  );

  existing.sort((a, b) => a.inputIndex - b.inputIndex);

  return [...currentUserItems, ...additions, ...existing];
};

const canonicalizeRecipientBasisPoints = (
  recipients: readonly RevShareRecipientAllocation[],
): Map<string, number> => {
  const basisPointsByKey = new Map<string, number>();
  for (const allocation of recipients) {
    if (allocation.splitBasisPoints > 0) {
      basisPointsByKey.set(getRevShareRecipientKey(allocation), allocation.splitBasisPoints);
    }
  }
  return basisPointsByKey;
};

export const materializeProposedSplit = ({
  allocations,
  activeUnallocatedBasisPoints,
}: MaterializeProposedSplitInput): RevShareSplit => {
  const recipients = allocations.filter((allocation) => allocation.splitBasisPoints > 0);
  const recipientTotal = recipients.reduce(
    (total, allocation) => total + allocation.splitBasisPoints,
    0,
  );
  const proposedUnallocated = Math.min(0, activeUnallocatedBasisPoints);
  const managingGroupBasisPoints =
    REV_SHARE_TOTAL_BASIS_POINTS - recipientTotal - proposedUnallocated;

  return {
    recipients,
    unallocatedBasisPoints: proposedUnallocated,
    managingGroupBasisPoints,
  };
};

export const areRevShareSplitsEqual = (left: RevShareSplit, right: RevShareSplit): boolean => {
  if (
    left.managingGroupBasisPoints !== right.managingGroupBasisPoints ||
    left.unallocatedBasisPoints !== right.unallocatedBasisPoints
  ) {
    return false;
  }

  const leftRecipients = canonicalizeRecipientBasisPoints(left.recipients);
  const rightRecipients = canonicalizeRecipientBasisPoints(right.recipients);
  if (leftRecipients.size !== rightRecipients.size) {
    return false;
  }

  for (const [key, basisPoints] of leftRecipients) {
    if (rightRecipients.get(key) !== basisPoints) {
      return false;
    }
  }

  return true;
};

const computeRecipientAllocationChanges = (
  activeSplit: RevShareSplit,
  proposedSplit: RevShareSplit,
  currentUserId: string | number,
): RevShareRecipientAllocationChange[] => {
  const activeByKey = new Map<string, { recipient: RevShareRecipient; splitBasisPoints: number }>();
  for (const allocation of activeSplit.recipients) {
    activeByKey.set(getRevShareRecipientKey(allocation), allocation);
  }

  const proposedByKey = new Map<
    string,
    { recipient: RevShareRecipient; splitBasisPoints: number }
  >();
  for (const allocation of proposedSplit.recipients) {
    proposedByKey.set(getRevShareRecipientKey(allocation), allocation);
  }

  const changes: RevShareRecipientAllocationChange[] = [];

  // Classify first (additions, then active edits/removals); display order is applied below.
  for (const { recipient, splitBasisPoints } of proposedSplit.recipients) {
    const key = getRevShareRecipientKey({ recipient, splitBasisPoints: 0 });
    if (!activeByKey.has(key)) {
      changes.push({
        recipient,
        fromBasisPoints: 0,
        toBasisPoints: splitBasisPoints,
        isAddition: true,
        isRemoval: false,
      });
    }
  }

  for (const { recipient, splitBasisPoints } of activeSplit.recipients) {
    const key = getRevShareRecipientKey({ recipient, splitBasisPoints: 0 });
    const proposed = proposedByKey.get(key);
    if (proposed) {
      changes.push({
        recipient,
        fromBasisPoints: splitBasisPoints,
        toBasisPoints: proposed.splitBasisPoints,
        isAddition: false,
        isRemoval: false,
      });
    } else {
      changes.push({
        recipient,
        fromBasisPoints: splitBasisPoints,
        toBasisPoints: 0,
        isAddition: false,
        isRemoval: true,
      });
    }
  }

  return sortRevShareRecipientsForStableDisplay(
    changes.map((change, inputIndex) => ({
      recipient: change.recipient,
      isAddition: change.isAddition,
      inputIndex,
      change,
    })),
    currentUserId,
  ).map(({ change }) => change);
};

export const buildManagerProposalDiff = (
  activeSplit: RevShareSplit,
  proposedSplit: RevShareSplit,
  currentUserId: string | number,
): Pick<ManagerProposal, 'type' | 'changes'> => {
  const type =
    activeSplit.unallocatedBasisPoints > 0 && proposedSplit.unallocatedBasisPoints === 0
      ? RevShareProposalType.AllocateUnallocated
      : RevShareProposalType.Edit;
  const changes: ManagerProposalChanges = {
    recipientChangesInStableDisplayOrder: computeRecipientAllocationChanges(
      activeSplit,
      proposedSplit,
      currentUserId,
    ),
    managingGroup: {
      fromBasisPoints: activeSplit.managingGroupBasisPoints,
      toBasisPoints: proposedSplit.managingGroupBasisPoints,
    },
    unallocated: {
      fromBasisPoints: activeSplit.unallocatedBasisPoints,
      toBasisPoints: proposedSplit.unallocatedBasisPoints,
    },
  };

  return { type, changes };
};

const requiresRecipientConfirmation = (
  proposalType: RevShareProposalType,
  change: RevShareRecipientAllocationChange,
): boolean => {
  if (proposalType === RevShareProposalType.Edit) {
    return change.isAddition || change.fromBasisPoints !== change.toBasisPoints;
  }
  if (proposalType === RevShareProposalType.AllocateUnallocated) {
    return change.toBasisPoints > change.fromBasisPoints;
  }
  return false;
};

export const materializeManagerProposal = (
  activeSplit: RevShareSplit,
  proposedSplit: RevShareSplit,
  currentUserId: string | number,
): ManagerProposal => {
  const { type, changes } = buildManagerProposalDiff(activeSplit, proposedSplit, currentUserId);
  const confirmations: RevShareRecipientConfirmation[] =
    changes.recipientChangesInStableDisplayOrder
      .filter((change) => requiresRecipientConfirmation(type, change))
      .map((change) => ({
        recipient: change.recipient,
        status: isRevShareCurrentUserRecipient(change.recipient, currentUserId)
          ? RevShareConfirmationStatus.Accepted
          : RevShareConfirmationStatus.Pending,
      }));

  return {
    id: '',
    type,
    split: proposedSplit,
    changes,
    confirmations,
  };
};
