// Pure helpers for revenue-share agreement eligibility and landing-list filtering.
import {
  REV_SHARE_TOTAL_BASIS_POINTS,
  type ManagerAgreement,
  type RecipientAgreement,
  type RevShareSplit,
} from '../interface/RevShareViewModel';

const hasProposal = (agreement: { proposed: unknown }): boolean => agreement.proposed !== null;

/**
 * Trivial manager split: the managing group keeps everything with no unallocated bucket and no positive recipient cuts.
 */
const isManagerSplitTrivial = (split: RevShareSplit): boolean =>
  split.managingGroupBasisPoints === REV_SHARE_TOTAL_BASIS_POINTS &&
  split.unallocatedBasisPoints === 0 &&
  split.recipients.every((recipient) => recipient.splitBasisPoints <= 0);

export const RevShare = {
  hasProposal,

  /** Keep on the manager landing list when there is an open proposal or a non-trivial active split. */
  shouldListManager: (agreement: ManagerAgreement): boolean =>
    hasProposal(agreement) || !isManagerSplitTrivial(agreement.active),

  /** Keep on the recipient landing list when there is an open proposal or a positive active share. */
  shouldListRecipient: (agreement: RecipientAgreement): boolean =>
    hasProposal(agreement) || agreement.active.recipientBasisPoints > 0,
};

export const filterLandingManagerAgreements = (
  agreements: readonly ManagerAgreement[],
): ManagerAgreement[] => agreements.filter(RevShare.shouldListManager);

export const filterLandingRecipientAgreements = (
  agreements: readonly RecipientAgreement[],
): RecipientAgreement[] => agreements.filter(RevShare.shouldListRecipient);
