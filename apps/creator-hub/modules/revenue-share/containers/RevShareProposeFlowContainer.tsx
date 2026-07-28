// Loads eligible revenue share targets and recipients, hydrates selected agreements, and submits validated split proposals.
import { useCallback, useEffect, useMemo, useRef, useState, type FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RevShareSplitEditorFlow, {
  type RevShareSplitEditorFlowStep,
} from '../components/RevShareSplitEditorFlow';
import RevShareTargetPickerView, {
  type RevShareTargetTab,
} from '../components/RevShareTargetPickerView';
import type { SplitEditorRow } from '../components/tables/RevShareSplitEditorTable';
import useRevShareFeedback from '../hooks/useRevShareFeedback';
import {
  RevShareAcceptOrDecline,
  RevShareRecipientType,
  type ManagerAgreement,
  type RevShareRecipient,
  type RevShareRecipientAllocation,
  type RevShareTarget,
} from '../interface/RevShareViewModel';
import { cancelRevShareProposal, getRevShareByTarget } from '../queries/revShareApi';
import {
  useRevShareForManager,
  useRevShareProposalMutations,
  useRevShareRecipientNames,
  useRevShareRespondMutation,
} from '../queries/revShareQueries';
import { useRevShareExperienceTargets } from '../queries/useRevShareExperienceTargets';
import { useRevShareRecipientSearch } from '../queries/useRevShareRecipientSearch';
import { useRevShareUgcTargets } from '../queries/useRevShareUgcTargets';
import {
  getRevShareRecipientKey,
  isRevShareCurrentUserRecipient,
  shouldAutoAcceptProposedAsCurrentUser,
} from '../utils/revShareUtils';

const MANAGING_GROUP_ROW_KEY = 'managing-group';
const TOTAL_BASIS_POINTS = 10_000;

type RevShareProposeLoadErrorProps = {
  backLabel: string;
  onBack: () => void;
  onReload: () => void;
};

const RevShareProposeLoadError: FunctionComponent<RevShareProposeLoadErrorProps> = ({
  backLabel,
  onBack,
  onReload,
}) => (
  <Grid container direction='column' alignItems='center'>
    <LoadError onReload={onReload} />
    <Button type='button' variant='Standard' size='Medium' onClick={onBack}>
      {backLabel}
    </Button>
  </Grid>
);

export type RevShareProposeFlowContainerProps = {
  managingGroupId: string;
  managingGroupName: string;
  managingGroupSubtitle: string;
  mode: 'create' | 'propose';
  existingAgreement?: ManagerAgreement;
  onTargetSelected: (target: RevShareTarget) => void;
  onExit: () => void;
  onProposeSuccess: () => void;
  onStepChange?: (step: RevShareSplitEditorFlowStep) => void;
};

const emptySplit = {
  recipients: [],
  unallocatedBasisPoints: 0,
  managingGroupBasisPoints: TOTAL_BASIS_POINTS,
};

const toTargetKey = (target: RevShareTarget) => `${target.type}:${target.id}`;

const needsTargetHydration = (
  mode: RevShareProposeFlowContainerProps['mode'],
  agreement: ManagerAgreement | undefined,
): boolean =>
  mode === 'propose' &&
  agreement != null &&
  agreement.activeId === null &&
  agreement.proposed === null;

type PickerCandidate = {
  target: RevShareTarget;
  targetName: string;
};

const toPickerRow = (
  candidate: PickerCandidate,
  agreement?: ManagerAgreement,
): ManagerAgreement => {
  if (agreement) {
    return { ...agreement, target: candidate.target, targetName: candidate.targetName };
  }
  return {
    target: candidate.target,
    targetName: candidate.targetName,
    activeId: null,
    active: emptySplit,
    proposed: null,
  };
};

const RevShareProposeFlowContainer: FunctionComponent<RevShareProposeFlowContainerProps> = ({
  managingGroupId,
  managingGroupName,
  managingGroupSubtitle,
  mode,
  existingAgreement,
  onTargetSelected,
  onExit,
  onProposeSuccess,
  onStepChange,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const router = useRouter();
  const { user } = useAuthentication();
  const currentUserId = user?.id;
  const currentUserRecipient = useMemo<RevShareRecipient | undefined>(
    () =>
      currentUserId != null
        ? { type: RevShareRecipientType.User, id: String(currentUserId) }
        : undefined,
    [currentUserId],
  );
  const shouldHydrateTarget = needsTargetHydration(mode, existingAgreement);
  const [target, setTarget] = useState<ManagerAgreement | null>(() => {
    if (mode === 'create' || shouldHydrateTarget) {
      return null;
    }
    return existingAgreement ?? null;
  });
  const [isTargetHydrating, setIsTargetHydrating] = useState(shouldHydrateTarget);
  const [hasTargetHydrationError, setHasTargetHydrationError] = useState(false);
  const [targetHydrationAttempt, setTargetHydrationAttempt] = useState(0);
  const [targetTab, setTargetTab] = useState<RevShareTargetTab>('experiences');
  const targetSelectionRequestRef = useRef(0);
  const managerQuery = useRevShareForManager(managingGroupId);
  const { refetch: refetchManagerAgreements } = managerQuery;
  const [recipientQuery, setRecipientQuery] = useState('');
  const experienceTargetsQuery = useRevShareExperienceTargets({
    managingGroupId,
    enabled: mode === 'create' && target === null,
  });
  const ugcTargetsQuery = useRevShareUgcTargets({
    managingGroupId,
    enabled: mode === 'create' && target === null,
  });
  const recipientSearch = useRevShareRecipientSearch({
    managingGroupId,
    keyword: recipientQuery,
  });
  const { propose } = useRevShareProposalMutations(managingGroupId);
  const respond = useRevShareRespondMutation(currentUserRecipient);
  const { showSuccess, showError } = useRevShareFeedback();
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const proposeRef = useRef(propose);
  const respondRef = useRef(respond);
  const refetchManagerAgreementsRef = useRef(refetchManagerAgreements);
  const currentUserIdRef = useRef(currentUserId);
  const showErrorRef = useRef(showError);
  const showSuccessRef = useRef(showSuccess);
  const onProposeSuccessRef = useRef(onProposeSuccess);
  useEffect(() => {
    proposeRef.current = propose;
    respondRef.current = respond;
    refetchManagerAgreementsRef.current = refetchManagerAgreements;
    currentUserIdRef.current = currentUserId;
    showErrorRef.current = showError;
    showSuccessRef.current = showSuccess;
    onProposeSuccessRef.current = onProposeSuccess;
  }, [
    currentUserId,
    onProposeSuccess,
    propose,
    refetchManagerAgreements,
    respond,
    showError,
    showSuccess,
  ]);
  const backLabel = tPendingTranslation(
    'Back',
    'Label on a button that returns to the previous step in a multi-step wizard.',
    translationKey('Action.Back', TranslationNamespace.Controls),
  );
  const agreementMap = useMemo(() => {
    const map = new Map<string, ManagerAgreement>();
    for (const agreement of managerQuery.data ?? []) {
      map.set(toTargetKey(agreement.target), agreement);
    }
    return map;
  }, [managerQuery.data]);
  const experienceRows = useMemo<ManagerAgreement[]>(
    () =>
      experienceTargetsQuery.items.map((item) =>
        toPickerRow(
          { target: item.target, targetName: item.targetName },
          agreementMap.get(toTargetKey(item.target)),
        ),
      ),
    [agreementMap, experienceTargetsQuery.items],
  );
  const ugcRows = useMemo<ManagerAgreement[]>(
    () =>
      ugcTargetsQuery.items.map((item) =>
        toPickerRow(
          { target: item.target, targetName: item.targetName },
          agreementMap.get(toTargetKey(item.target)),
        ),
      ),
    [agreementMap, ugcTargetsQuery.items],
  );
  const targetRows = useMemo<ManagerAgreement[]>(
    () => [...experienceRows, ...ugcRows],
    [experienceRows, ugcRows],
  );
  const activeRecipientRefs = useMemo(
    () => target?.active.recipients.map((allocation) => allocation.recipient) ?? [],
    [target?.active.recipients],
  );
  const {
    resolveGroupParty,
    resolveRecipientParty,
    isLoading: arePartyIdentitiesLoading,
  } = useRevShareRecipientNames(activeRecipientRefs, managingGroupId ? [managingGroupId] : []);
  const initialRows = useMemo<SplitEditorRow[]>(() => {
    const active = target?.active ?? emptySplit;
    const recipientTotal = active.recipients.reduce(
      (total, allocation) => total + allocation.splitBasisPoints,
      0,
    );
    const managingGroupParty = resolveGroupParty(managingGroupId, managingGroupName);
    return [
      {
        key: MANAGING_GROUP_ROW_KEY,
        id: managingGroupId,
        name: managingGroupParty.name,
        subtitle: managingGroupSubtitle,
        type: RevShareRecipientType.Group,
        identity: { target: managingGroupParty.target, targetType: CreatorType.Group },
        previousBasisPoints: active.managingGroupBasisPoints,
        basisPoints: TOTAL_BASIS_POINTS - recipientTotal,
        disabled: true,
        isManagingGroup: true,
      },
      ...active.recipients.map((allocation) => {
        const party = resolveRecipientParty(allocation.recipient);
        return {
          key: getRevShareRecipientKey(allocation.recipient),
          id: allocation.recipient.id,
          name: party.name,
          type: allocation.recipient.type,
          identity: {
            target: party.target,
            targetType:
              allocation.recipient.type === RevShareRecipientType.User
                ? CreatorType.User
                : CreatorType.Group,
          },
          previousBasisPoints: allocation.splitBasisPoints,
          basisPoints: allocation.splitBasisPoints,
          isCurrentUser: isRevShareCurrentUserRecipient(allocation.recipient, currentUserId),
        };
      }),
    ];
  }, [
    currentUserId,
    managingGroupId,
    managingGroupName,
    managingGroupSubtitle,
    resolveGroupParty,
    resolveRecipientParty,
    target,
  ]);
  const handleSubmitProposal = useCallback(
    async (allocations: readonly RevShareRecipientAllocation[]) => {
      if (target === null) {
        return;
      }
      setIsSubmittingProposal(true);
      try {
        const pendingProposalId = target.proposed?.id;
        if (pendingProposalId != null) {
          try {
            await cancelRevShareProposal(pendingProposalId);
          } catch (error) {
            // Ignore cancel outcome; always attempt to create the new proposal.
            console.error(
              '[RevShareProposeFlowContainer] Failed to cancel open proposal before propose',
              { pendingProposalId, error },
            );
          }
        }
        try {
          const result = await proposeRef.current.mutateAsync({
            target: target.target,
            activeRevShareId: target.activeId,
            allocations: [...allocations],
            allocateUnallocated: target.active.unallocatedBasisPoints > 0,
          });
          if (!result.updateSucceeded) {
            showErrorRef.current('propose');
            return;
          }
          if (
            result.proposedAgreementId != null &&
            shouldAutoAcceptProposedAsCurrentUser(result.confirmations, currentUserIdRef.current)
          ) {
            try {
              await respondRef.current.mutateAsync({
                proposedRevShareId: result.proposedAgreementId,
                response: RevShareAcceptOrDecline.Accept,
              });
              // Accept only invalidates recipient queries; refresh manager so detail shows Accepted.
              await refetchManagerAgreementsRef.current();
            } catch (error) {
              // Proposal already created; detail still shows Pending for self — accept manually.
              console.error(
                '[RevShareProposeFlowContainer] Failed to auto-accept proposed revenue share',
                { proposedAgreementId: result.proposedAgreementId, error },
              );
            }
          }
          showSuccessRef.current('propose');
          onProposeSuccessRef.current();
        } catch {
          showErrorRef.current('propose');
        }
      } finally {
        setIsSubmittingProposal(false);
      }
    },
    [target],
  );
  useEffect(() => {
    if (!shouldHydrateTarget || existingAgreement == null || target !== null) {
      return undefined;
    }

    let cancelled = false;
    void getRevShareByTarget(existingAgreement.target, currentUserId ?? '')
      .then((hydratedAgreement) => {
        if (cancelled) {
          return;
        }
        setTarget({
          ...hydratedAgreement,
          target: existingAgreement.target,
          targetName: existingAgreement.targetName || hydratedAgreement.targetName,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setHasTargetHydrationError(true);
          showError('propose');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsTargetHydrating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    currentUserId,
    existingAgreement,
    shouldHydrateTarget,
    showError,
    target,
    targetHydrationAttempt,
  ]);

  useEffect(
    () => () => {
      targetSelectionRequestRef.current += 1;
    },
    [],
  );

  const handleRetryTargetHydration = useCallback(() => {
    setHasTargetHydrationError(false);
    setIsTargetHydrating(true);
    setTargetHydrationAttempt((attempt) => attempt + 1);
  }, []);

  const handleReloadManagerAgreements = useCallback(() => {
    void refetchManagerAgreements();
  }, [refetchManagerAgreements]);

  const handleTargetSelect = useCallback(
    async (row: ManagerAgreement) => {
      const requestId = targetSelectionRequestRef.current + 1;
      targetSelectionRequestRef.current = requestId;
      setIsTargetHydrating(true);
      try {
        const hydratedAgreement = await getRevShareByTarget(row.target, currentUserId ?? '');
        if (targetSelectionRequestRef.current !== requestId) {
          return;
        }
        setTarget({ ...hydratedAgreement, target: row.target, targetName: row.targetName });
        onTargetSelected(row.target);
      } catch {
        if (targetSelectionRequestRef.current === requestId) {
          showError('propose');
        }
      } finally {
        if (targetSelectionRequestRef.current === requestId) {
          setIsTargetHydrating(false);
        }
      }
    },
    [currentUserId, onTargetSelected, showError],
  );

  if (mode === 'create' && target === null) {
    if (experienceTargetsQuery.isLoading || managerQuery.isLoading || isTargetHydrating) {
      return (
        <Grid container justifyContent='center'>
          <CircularProgress />
        </Grid>
      );
    }
    if (managerQuery.error) {
      return (
        <RevShareProposeLoadError
          backLabel={backLabel}
          onBack={onExit}
          onReload={handleReloadManagerAgreements}
        />
      );
    }
    if (targetTab === 'experiences' && experienceTargetsQuery.isError) {
      return (
        <RevShareProposeLoadError backLabel={backLabel} onBack={onExit} onReload={router.reload} />
      );
    }
    return (
      <RevShareTargetPickerView
        rows={targetRows}
        onRowClick={handleTargetSelect}
        onBack={onExit}
        activeTab={targetTab}
        onTabChange={setTargetTab}
        isUgcLoading={ugcTargetsQuery.isLoading}
        isInventoryLoading={
          targetTab === 'experiences'
            ? experienceTargetsQuery.hasNextPage
            : ugcTargetsQuery.hasNextPage
        }
        ugcError={ugcTargetsQuery.error}
        onRetryUgc={() => {
          ugcTargetsQuery.refetch();
        }}
      />
    );
  }

  if (target === null && hasTargetHydrationError && !isTargetHydrating) {
    return (
      <RevShareProposeLoadError
        backLabel={backLabel}
        onBack={onExit}
        onReload={handleRetryTargetHydration}
      />
    );
  }

  if (target === null || arePartyIdentitiesLoading) {
    return (
      <Grid container justifyContent='center'>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <RevShareSplitEditorFlow
      activeSplit={target.active}
      initialRows={initialRows}
      searchResults={recipientSearch.data}
      isSearchLoading={recipientSearch.isLoading}
      searchError={!!recipientSearch.error}
      onSearchQueryChange={setRecipientQuery}
      onExit={onExit}
      onSubmitProposal={handleSubmitProposal}
      isSubmitting={propose.isPending || respond.isPending || isSubmittingProposal}
      replacesOpenProposal={target.proposed != null}
      presentation={mode === 'propose' ? 'dialog' : 'page'}
      onStepChange={onStepChange}
    />
  );
};

export default RevShareProposeFlowContainer;
