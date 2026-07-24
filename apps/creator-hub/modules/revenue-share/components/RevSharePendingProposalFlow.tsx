// Orchestrates pending proposal review and cancellation terms using URL-backed action state.
import { useCallback, useMemo, useRef, type FunctionComponent } from 'react';
import useRevShareFeedback from '../hooks/useRevShareFeedback';
import type {
  ManagerAgreement,
  ResolvedRevShareParty,
  RevShareRecipient,
} from '../interface/RevShareViewModel';
import { useRevShareProposalMutations } from '../queries/revShareQueries';
import RevShareCancelTermsView from './RevShareCancelTermsView';
import RevSharePendingProposalReviewView from './RevSharePendingProposalReviewView';
import { buildRevShareDiffRowsFromManagerProposal } from './tables/RevShareDiffTable';

const MANAGING_GROUP_ROW_KEY = 'managing-group';

export type RevSharePendingProposalFlowProps = {
  managingGroupId: string;
  managingGroupName: string;
  managingGroupSubtitle: string;
  agreement: ManagerAgreement;
  resolveRecipientParty: (recipient: RevShareRecipient) => ResolvedRevShareParty;
  action: 'propose' | 'cancel';
  isTermsAccepted: boolean;
  onTermsAcceptedChange: (isAccepted: boolean) => void;
  onBack: () => void;
  onCancelProposal: () => void;
  onCancelTermsBack: () => void;
  onDone: () => void;
};

const RevSharePendingProposalFlow: FunctionComponent<RevSharePendingProposalFlowProps> = ({
  managingGroupId,
  managingGroupName,
  managingGroupSubtitle,
  agreement,
  resolveRecipientParty,
  action,
  isTermsAccepted,
  onTermsAcceptedChange,
  onBack,
  onCancelProposal,
  onCancelTermsBack,
  onDone,
}) => {
  const proposal = agreement.proposed;
  const { cancel } = useRevShareProposalMutations(managingGroupId, onDone);
  const { showSuccess, showError } = useRevShareFeedback();
  const isCancelPendingRef = useRef(false);
  const rows = useMemo(
    () =>
      proposal === null
        ? []
        : buildRevShareDiffRowsFromManagerProposal({
            proposal,
            managingGroup: {
              key: MANAGING_GROUP_ROW_KEY,
              id: managingGroupId,
              name: managingGroupName,
              subtitle: managingGroupSubtitle,
              previousBasisPoints: agreement.active.managingGroupBasisPoints,
            },
            resolveRecipientParty,
          }),
    [
      agreement.active.managingGroupBasisPoints,
      managingGroupId,
      managingGroupName,
      managingGroupSubtitle,
      proposal,
      resolveRecipientParty,
    ],
  );
  const handleCancelSubmit = useCallback(async () => {
    if (proposal === null || cancel.isPending || isCancelPendingRef.current) {
      return;
    }
    isCancelPendingRef.current = true;
    try {
      await cancel.mutateAsync(proposal.id);
      showSuccess('cancel');
    } catch {
      showError('cancel');
    } finally {
      isCancelPendingRef.current = false;
    }
  }, [cancel, proposal, showError, showSuccess]);

  if (proposal === null) {
    return null;
  }

  if (action === 'cancel') {
    return (
      <RevShareCancelTermsView
        isAccepted={isTermsAccepted}
        onAcceptedChange={onTermsAcceptedChange}
        onBack={onCancelTermsBack}
        onSubmit={handleCancelSubmit}
        isSubmitting={cancel.isPending}
      />
    );
  }

  return (
    <RevSharePendingProposalReviewView
      rows={rows}
      onBack={onBack}
      onCancelProposal={onCancelProposal}
    />
  );
};

export default RevSharePendingProposalFlow;
