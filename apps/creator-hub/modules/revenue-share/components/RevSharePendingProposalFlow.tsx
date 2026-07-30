// Orchestrates pending proposal review and cancellation terms using URL-backed action state.
import { useCallback, useEffect, useMemo, useRef, useState, type FunctionComponent } from 'react';
import useRevShareFeedback from '../hooks/useRevShareFeedback';
import type {
  ManagerAgreement,
  ResolvedRevShareParty,
  RevShareRecipient,
} from '../interface/RevShareViewModel';
import { useRevShareProposalMutations } from '../queries/revShareQueries';
import {
  classifyRevShareMutationError,
  type ClassifiedRevShareMutationError,
} from '../utils/revShareMutationError';
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
  currentUserId?: string | number | null;
  action: 'review' | 'cancel';
  canManage?: boolean;
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
  currentUserId,
  action,
  canManage = true,
  isTermsAccepted,
  onTermsAcceptedChange,
  onBack,
  onCancelProposal,
  onCancelTermsBack,
  onDone,
}) => {
  const proposal = agreement.proposed;
  const { cancel, invalidateManager } = useRevShareProposalMutations(managingGroupId, onDone);
  const { showSuccess } = useRevShareFeedback();
  const [mutationError, setMutationError] = useState<ClassifiedRevShareMutationError | null>(null);
  const [isRefreshingStaleError, setIsRefreshingStaleError] = useState(false);
  const isCancelPendingRef = useRef(false);
  const isRefreshingStaleErrorRef = useRef(false);
  const invalidateManagerRef = useRef(invalidateManager);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    invalidateManagerRef.current = invalidateManager;
    onDoneRef.current = onDone;
  }, [invalidateManager, onDone]);
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
            currentUserId,
          }),
    [
      agreement.active.managingGroupBasisPoints,
      currentUserId,
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
    setMutationError(null);
    try {
      await cancel.mutateAsync(proposal.id);
      showSuccess('cancel');
    } catch (error) {
      setMutationError(classifyRevShareMutationError('cancel', error));
    } finally {
      isCancelPendingRef.current = false;
    }
  }, [cancel, proposal, showSuccess]);
  const handleRefreshStaleError = useCallback(async () => {
    if (isRefreshingStaleErrorRef.current) {
      return;
    }
    isRefreshingStaleErrorRef.current = true;
    setIsRefreshingStaleError(true);
    try {
      await invalidateManagerRef.current({ throwOnError: true });
      onDoneRef.current();
    } catch {
      // Keep the stale banner open when refresh fails.
    } finally {
      isRefreshingStaleErrorRef.current = false;
      setIsRefreshingStaleError(false);
    }
  }, []);

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
        isSubmitting={cancel.isPending || isRefreshingStaleError}
        mutationError={mutationError}
        onRefreshStaleError={mutationError?.kind === 'stale' ? handleRefreshStaleError : undefined}
      />
    );
  }

  return (
    <RevSharePendingProposalReviewView
      rows={rows}
      onBack={onBack}
      onCancelProposal={onCancelProposal}
      canManage={canManage}
    />
  );
};

export default RevSharePendingProposalFlow;
