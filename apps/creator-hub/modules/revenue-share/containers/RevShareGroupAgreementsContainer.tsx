// Group revenue-share shell: URL-synced managed/recipient perspective, manager landing/detail/lifecycles, and delegation of recipient detail/respond to RevShareRecipientContainer.
import { useCallback, useEffect, useMemo, useState, type FunctionComponent } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useLocalization, useTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RevShareBanner from '../components/RevShareBanner';
import RevShareDetailView from '../components/RevShareDetailView';
import RevShareLandingView from '../components/RevShareLandingView';
import RevShareLifecycleDialog from '../components/RevShareLifecycleDialog';
import RevSharePendingProposalFlow from '../components/RevSharePendingProposalFlow';
import type { RevShareSplitEditorFlowStep } from '../components/RevShareSplitEditorFlow';
import type {
  ManagerAgreement,
  RecipientAgreement,
  RevShareRecipient,
  RevShareTarget,
} from '../interface/RevShareViewModel';
import {
  RevShareConfirmationStatus,
  RevShareRecipientType,
  RevShareTargetType,
} from '../interface/RevShareViewModel';
import {
  useRevShareForManager,
  useRevShareForRecipient,
  useRevShareRecipientNames,
} from '../queries/revShareQueries';
import {
  REV_SHARE_QUERY_KEYS,
  normalizeRevShareRouteQuery,
  resolveRevSharePerspective,
  type RevSharePerspective,
} from '../utils/revShareRouteState';
import {
  findManagerAgreementByTarget,
  findRecipientAgreementByTarget,
  parseRevShareTargetQuery,
} from '../utils/revShareTargetSelection';
import { asNumberTypedId } from '../utils/revShareUtils';
import { emptyManagerAgreement } from '../utils/revShareViewMapper';
import RevShareProposeFlowContainer from './RevShareProposeFlowContainer';
import RevShareRecipientContainer from './RevShareRecipientContainer';

const EMPTY_MANAGER_ROWS: ManagerAgreement[] = [];
const EMPTY_RECIPIENT_ROWS: RecipientAgreement[] = [];
const QUERY_TRANSITION_OPTIONS = { scroll: false } as const;
const MANAGING_GROUP_PARTY_COUNT = 1;

const RevShareGroupAgreementsContainer: FunctionComponent = () => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { locale } = useLocalization();
  const { user } = useAuthentication();
  const currentUserId = user?.id;
  const { organization, isOrganizationLoading, refreshOrganization } = useCurrentOrganization();
  const managingGroupId = organization?.groupId;
  const managerQuery = useRevShareForManager(managingGroupId);
  const groupRecipient = useMemo<RevShareRecipient | undefined>(
    () =>
      managingGroupId !== undefined
        ? { type: RevShareRecipientType.Group, id: managingGroupId }
        : undefined,
    [managingGroupId],
  );
  const recipientQuery = useRevShareForRecipient(groupRecipient);
  const [{ targetType, targetId, action, perspective: perspectiveQuery }, setQuery] =
    useQueryParams(REV_SHARE_QUERY_KEYS, QUERY_TRANSITION_OPTIONS);
  const perspective = resolveRevSharePerspective(perspectiveQuery, 'group');
  const routeNormalization = useMemo(
    () =>
      normalizeRevShareRouteQuery({
        action,
        perspective: perspectiveQuery,
      }),
    [action, perspectiveQuery],
  );
  const selectedAction = routeNormalization.action;
  const [focusReturnTarget, setFocusReturnTarget] = useState<RevShareTarget | null>(null);
  const [isCancelTermsAccepted, setIsCancelTermsAccepted] = useState(false);
  const [managedFlowStep, setManagedFlowStep] = useState<RevShareSplitEditorFlowStep>('editor');
  const selectedTarget = useMemo(
    () => parseRevShareTargetQuery(targetType, targetId),
    [targetId, targetType],
  );
  const selectedManagerAgreement = useMemo(() => {
    if (perspective !== 'managed') {
      return null;
    }
    const found = findManagerAgreementByTarget(
      managerQuery.data ?? EMPTY_MANAGER_ROWS,
      selectedTarget,
    );
    if (found) {
      return found;
    }
    if (selectedTarget && (selectedAction === 'propose' || selectedAction === 'cancel')) {
      return emptyManagerAgreement(selectedTarget);
    }
    return null;
  }, [managerQuery.data, perspective, selectedAction, selectedTarget]);
  const hasTargetQuery = targetType != null || targetId != null;
  const hasActionQuery = action != null;
  const detailRecipients = useMemo(
    () => [
      ...(selectedManagerAgreement?.active.recipients ?? []).map(({ recipient }) => recipient),
      ...(selectedManagerAgreement?.proposed?.split.recipients ?? []).map(
        (allocation) => allocation.recipient,
      ),
    ],
    [selectedManagerAgreement],
  );
  const detailManagingGroupIds = useMemo(
    () =>
      perspective === 'managed' &&
      managingGroupId &&
      (selectedManagerAgreement !== null ||
        selectedAction === 'create' ||
        selectedAction === 'propose')
        ? [managingGroupId]
        : [],
    [managingGroupId, perspective, selectedAction, selectedManagerAgreement],
  );
  const {
    resolveRecipientParty,
    resolveGroupParty,
    isLoading: arePartyNamesLoading,
    error: partyNamesError,
    refetch: refetchPartyNames,
  } = useRevShareRecipientNames(detailRecipients, detailManagingGroupIds);

  const managingGroupLabel = tPendingTranslation(
    'Managing group',
    'Column heading for the managing group badge in revenue share recipient tables.',
    translationKey('Label.ManagingGroup', TranslationNamespace.RevenueShareAgreements),
  );
  const unallocatedLabel = tPendingTranslation(
    'Unallocated',
    'Label for the unallocated portion of a revenue-share split.',
    translationKey('Label.Unallocated', TranslationNamespace.RevenueShareAgreements),
  );
  const totalSplitsLabel = tPendingTranslation(
    'Total Splits',
    'Title shown above the total party split count in a revenue share chart.',
    translationKey('Title.TotalSplits', TranslationNamespace.RevenueShareAgreements),
  );
  const experienceLabel = tPendingTranslation(
    'Experience',
    'Target type label for an experience with a revenue share agreement.',
    translationKey('Label.Experience', TranslationNamespace.RevenueShareAgreements),
  );
  const ugcItemLabel = tPendingTranslation(
    'UGC item',
    'Target type label for a UGC item with a revenue share agreement.',
    translationKey('Label.UgcItem', TranslationNamespace.RevenueShareAgreements),
  );
  const lifecycleCloseLabel = tPendingTranslation(
    'Close',
    'Accessible label for closing a revenue share lifecycle dialog.',
    translationKey('Action.Close', TranslationNamespace.RevenueShareAgreements),
  );
  const proposeChangesLabel = tPendingTranslation(
    'Propose changes',
    'Button label to propose a new revenue share split.',
    translationKey('Action.ProposeChanges', TranslationNamespace.RevenueShareAgreements),
  );
  const viewProposalDetailsLabel = tPendingTranslation(
    'View details',
    'Button label to review or cancel a pending revenue share proposal.',
    translationKey('Action.ViewProposalDetails', TranslationNamespace.RevenueShareAgreements),
  );
  const pendingRecipientCount =
    selectedManagerAgreement?.proposed?.confirmations.filter(
      ({ status }) => status === RevShareConfirmationStatus.Pending,
    ).length ?? 0;
  const pendingProposalMessage =
    pendingRecipientCount === 0
      ? tPendingTranslation(
          'Pending change request.',
          'Banner title shown on a managed revenue share agreement while a proposal is open and no recipient responses remain.',
          translationKey(
            'Message.PendingChangeRequest',
            TranslationNamespace.RevenueShareAgreements,
          ),
        )
      : pendingRecipientCount === 1
        ? tPendingTranslation(
            'Pending change request: 1 recipient pending.',
            'Banner title shown on a managed revenue share agreement while a proposal is open and one recipient has not yet responded.',
            translationKey(
              'Message.PendingChangeRequestOne',
              TranslationNamespace.RevenueShareAgreements,
            ),
          )
        : tPendingTranslation(
            'Pending change request: {count} recipients pending.',
            'Banner title shown on a managed revenue share agreement while a proposal is open and multiple recipients have not yet responded; {count} is the number of pending recipients.',
            translationKey(
              'Message.PendingChangeRequestMultiple',
              TranslationNamespace.RevenueShareAgreements,
            ),
            { count: String(pendingRecipientCount) },
          );

  const closeManagedLifecycleToDetail = useCallback(() => {
    setIsCancelTermsAccepted(false);
    setQuery({
      targetType: selectedTarget?.type,
      targetId: selectedTarget?.id,
      action: undefined,
      perspective: 'managed' as const,
    });
  }, [selectedTarget, setQuery]);

  useEffect(() => {
    if (
      isOrganizationLoading ||
      managerQuery.isLoading ||
      managerQuery.error ||
      (perspective === 'recipient' && (recipientQuery.isLoading || recipientQuery.error)) ||
      arePartyNamesLoading ||
      partyNamesError ||
      !managingGroupId
    ) {
      return;
    }

    const normalize = (
      next: Partial<Record<(typeof REV_SHARE_QUERY_KEYS)[number], string | undefined>>,
    ) => {
      setQuery(next, { skipHistory: true });
    };

    if (perspectiveQuery != null && routeNormalization.perspective == null) {
      normalize({ perspective: undefined });
      return;
    }

    if (hasActionQuery && selectedAction == null) {
      normalize({ action: undefined });
      return;
    }
    if (selectedAction === 'create' && hasTargetQuery) {
      normalize({ targetType: undefined, targetId: undefined });
      return;
    }
    if (
      perspective === 'recipient' &&
      (selectedAction === 'create' || selectedAction === 'propose' || selectedAction === 'cancel')
    ) {
      normalize({ action: undefined });
      return;
    }
    if (selectedAction === 'create' && perspective !== 'managed') {
      normalize({ action: undefined });
      return;
    }
    if (
      perspective === 'managed' &&
      (selectedAction === 'propose' ||
        selectedAction === 'review' ||
        selectedAction === 'cancel') &&
      !selectedManagerAgreement
    ) {
      normalize({ action: undefined, targetType: undefined, targetId: undefined });
      return;
    }
    if (
      (selectedAction === 'cancel' || selectedAction === 'review') &&
      selectedManagerAgreement?.proposed === null
    ) {
      normalize({
        targetType: selectedTarget?.type,
        targetId: selectedTarget?.id,
        action: undefined,
        perspective: 'managed',
      });
      return;
    }
    if (perspective === 'recipient') {
      const selectedRecipientAgreement = findRecipientAgreementByTarget(
        recipientQuery.data ?? EMPTY_RECIPIENT_ROWS,
        selectedTarget,
      );

      if (selectedAction === 'review') {
        const hasValidRecipientReviewFlow =
          selectedRecipientAgreement != null && selectedRecipientAgreement.proposed !== null;
        if (!hasValidRecipientReviewFlow && action != null) {
          normalize({ action: undefined });
          return;
        }
      }

      if (hasTargetQuery && (!selectedTarget || !selectedRecipientAgreement)) {
        normalize({
          targetType: undefined,
          targetId: undefined,
          action: undefined,
        });
        return;
      }
    }
    if (hasTargetQuery && !selectedTarget) {
      normalize({ targetType: undefined, targetId: undefined, action: undefined });
    }
  }, [
    action,
    arePartyNamesLoading,
    hasActionQuery,
    hasTargetQuery,
    isOrganizationLoading,
    managerQuery.error,
    managerQuery.isLoading,
    managingGroupId,
    partyNamesError,
    perspective,
    perspectiveQuery,
    recipientQuery.data,
    recipientQuery.error,
    recipientQuery.isLoading,
    routeNormalization.perspective,
    selectedAction,
    selectedManagerAgreement,
    selectedTarget,
    setQuery,
  ]);

  const handlePerspectiveChange = useCallback(
    (nextPerspective: RevSharePerspective) => {
      setQuery({
        perspective: nextPerspective,
        targetType: undefined,
        targetId: undefined,
        action: undefined,
      });
    },
    [setQuery],
  );
  const handleManagerRowClick = useCallback(
    (agreement: ManagerAgreement) => {
      setFocusReturnTarget(agreement.target);
      setQuery({
        targetType: agreement.target.type,
        targetId: agreement.target.id,
        perspective: 'managed',
        action: undefined,
      });
    },
    [setQuery],
  );
  const handleRecipientRowClick = useCallback(
    (agreement: RecipientAgreement) => {
      setFocusReturnTarget(agreement.target);
      setQuery({
        targetType: agreement.target.type,
        targetId: agreement.target.id,
        perspective: 'recipient',
        action: undefined,
      });
    },
    [setQuery],
  );
  const handleBack = useCallback(() => {
    if (selectedManagerAgreement) {
      setFocusReturnTarget(selectedManagerAgreement.target);
    }
    setQuery({
      targetType: undefined,
      targetId: undefined,
      action: undefined,
    });
  }, [selectedManagerAgreement, setQuery]);
  const handleNewAgreement = useCallback(() => {
    setQuery({
      action: 'create',
      targetType: undefined,
      targetId: undefined,
      perspective: 'managed',
    });
  }, [setQuery]);
  const handleProposeChanges = useCallback(() => {
    if (!selectedManagerAgreement) {
      return;
    }
    setManagedFlowStep('editor');
    setQuery({
      targetType: selectedManagerAgreement.target.type,
      targetId: selectedManagerAgreement.target.id,
      action: 'propose',
      perspective: 'managed',
    });
  }, [selectedManagerAgreement, setQuery]);
  const handleViewPendingDetails = useCallback(() => {
    if (!selectedManagerAgreement) {
      return;
    }
    setQuery({
      targetType: selectedManagerAgreement.target.type,
      targetId: selectedManagerAgreement.target.id,
      action: 'review',
      perspective: 'managed',
    });
  }, [selectedManagerAgreement, setQuery]);
  const handleTargetSelected = useCallback(
    (target: ManagerAgreement['target']) => {
      setQuery({
        targetType: target.type,
        targetId: target.id,
        action: 'propose',
        perspective: 'managed',
      });
    },
    [setQuery],
  );
  const handleCreateExit = useCallback(() => {
    setQuery({
      action: undefined,
      targetType: undefined,
      targetId: undefined,
    });
  }, [setQuery]);
  const handleProposeExit = useCallback(() => {
    setManagedFlowStep('editor');
    if (!selectedManagerAgreement) {
      setQuery({
        action: undefined,
        targetType: undefined,
        targetId: undefined,
      });
      return;
    }
    setQuery({
      targetType: selectedManagerAgreement.target.type,
      targetId: selectedManagerAgreement.target.id,
      action: undefined,
      perspective: 'managed',
    });
  }, [selectedManagerAgreement, setQuery]);
  const handlePendingBack = useCallback(() => {
    handleProposeExit();
  }, [handleProposeExit]);
  const handleCancelProposal = useCallback(() => {
    if (!selectedManagerAgreement) {
      return;
    }
    setIsCancelTermsAccepted(false);
    setQuery({
      targetType: selectedManagerAgreement.target.type,
      targetId: selectedManagerAgreement.target.id,
      action: 'cancel',
      perspective: 'managed',
    });
  }, [selectedManagerAgreement, setQuery]);
  const handleCancelTermsBack = useCallback(() => {
    if (!selectedManagerAgreement) {
      return;
    }
    setQuery({
      targetType: selectedManagerAgreement.target.type,
      targetId: selectedManagerAgreement.target.id,
      action: 'review',
      perspective: 'managed',
    });
  }, [selectedManagerAgreement, setQuery]);
  const handleCancelSuccess = useCallback(() => {
    closeManagedLifecycleToDetail();
  }, [closeManagedLifecycleToDetail]);
  const handleManagedLifecycleClose = useCallback(() => {
    handleProposeExit();
  }, [handleProposeExit]);

  if (
    isOrganizationLoading ||
    managerQuery.isLoading ||
    (perspective === 'recipient' && recipientQuery.isLoading) ||
    arePartyNamesLoading
  ) {
    return (
      <Grid container justifyContent='center'>
        <CircularProgress />
      </Grid>
    );
  }
  if (!managingGroupId) {
    return <LoadError onReload={refreshOrganization} />;
  }
  if (managerQuery.error) {
    return <LoadError onReload={managerQuery.refetch} />;
  }
  if (perspective === 'recipient' && recipientQuery.error) {
    return <LoadError onReload={recipientQuery.refetch} />;
  }
  if (partyNamesError) {
    return <LoadError onReload={refetchPartyNames} />;
  }

  const managingGroupName = resolveGroupParty(managingGroupId, managingGroupLabel).name;
  const proposeFlowSharedProps = {
    managingGroupId,
    managingGroupName,
    managingGroupSubtitle: managingGroupLabel,
    onTargetSelected: handleTargetSelected,
    onProposeSuccess: handleProposeExit,
  };
  const landingView = (
    <RevShareLandingView
      managerRows={managerQuery.data ?? EMPTY_MANAGER_ROWS}
      recipientRows={recipientQuery.data ?? EMPTY_RECIPIENT_ROWS}
      perspective={perspective}
      onPerspectiveChange={handlePerspectiveChange}
      onManagerRowClick={handleManagerRowClick}
      onRecipientRowClick={handleRecipientRowClick}
      onNewAgreement={handleNewAgreement}
      focusTarget={focusReturnTarget}
    />
  );

  if (perspective === 'managed' && selectedAction === 'create') {
    return (
      <RevShareProposeFlowContainer
        {...proposeFlowSharedProps}
        mode='create'
        onExit={handleCreateExit}
      />
    );
  }

  if (perspective === 'recipient') {
    return (
      <>
        {!hasTargetQuery && landingView}
        <RevShareRecipientContainer
          recipient={groupRecipient}
          canRespond
          isReady
          surface='embedded'
        />
      </>
    );
  }

  const pendingLifecycleAction =
    selectedManagerAgreement !== null &&
    selectedManagerAgreement.proposed !== null &&
    (selectedAction === 'cancel' || selectedAction === 'review')
      ? selectedAction
      : null;
  const managedLifecycleFlow =
    selectedManagerAgreement !== null && pendingLifecycleAction !== null ? (
      <RevSharePendingProposalFlow
        managingGroupId={managingGroupId}
        managingGroupName={managingGroupName}
        managingGroupSubtitle={managingGroupLabel}
        agreement={selectedManagerAgreement}
        resolveRecipientParty={resolveRecipientParty}
        currentUserId={currentUserId}
        action={pendingLifecycleAction}
        isTermsAccepted={isCancelTermsAccepted}
        onTermsAcceptedChange={setIsCancelTermsAccepted}
        onBack={handlePendingBack}
        onCancelProposal={handleCancelProposal}
        onCancelTermsBack={handleCancelTermsBack}
        onDone={handleCancelSuccess}
      />
    ) : selectedManagerAgreement && selectedAction === 'propose' ? (
      <RevShareProposeFlowContainer
        key={`${selectedManagerAgreement.target.type}:${selectedManagerAgreement.target.id}`}
        {...proposeFlowSharedProps}
        mode='propose'
        existingAgreement={selectedManagerAgreement}
        onExit={handleProposeExit}
        onStepChange={setManagedFlowStep}
      />
    ) : null;
  const managedLifecycleTitle =
    selectedAction === 'cancel'
      ? tPendingTranslation(
          'Cancel proposal',
          'Heading for the revenue-share proposal cancellation consent step.',
          translationKey(
            'Heading.CancelProposalTerms',
            TranslationNamespace.RevenueShareAgreements,
          ),
        )
      : selectedAction === 'review'
        ? tPendingTranslation(
            'Pending proposal',
            'Heading for the pending revenue share proposal review step.',
            translationKey('Heading.PendingProposal', TranslationNamespace.RevenueShareAgreements),
          )
        : managedFlowStep === 'editor'
          ? tPendingTranslation(
              'Edit recipients',
              'Heading and accessible table label for editing revenue share recipients.',
              translationKey('Heading.EditRecipients', TranslationNamespace.RevenueShareAgreements),
            )
          : managedFlowStep === 'review'
            ? tPendingTranslation(
                'Review changes',
                'Heading for reviewing a proposed revenue share split.',
                translationKey(
                  'Heading.ReviewChanges',
                  TranslationNamespace.RevenueShareAgreements,
                ),
              )
            : tPendingTranslation(
                'Terms & implications',
                'Heading for the revenue-share proposal consent step.',
                translationKey(
                  'Heading.TermsAndImplications',
                  TranslationNamespace.RevenueShareAgreements,
                ),
              );
  const managedLifecycleAction =
    managedLifecycleFlow !== null && selectedAction !== 'create' ? selectedAction : null;

  if (!selectedManagerAgreement) {
    return (
      <>
        {landingView}
        {managedLifecycleAction !== null && managedLifecycleFlow !== null ? (
          <RevShareLifecycleDialog
            open
            title={managedLifecycleTitle}
            closeLabel={lifecycleCloseLabel}
            onClose={handleManagedLifecycleClose}>
            {managedLifecycleFlow}
          </RevShareLifecycleDialog>
        ) : null}
      </>
    );
  }

  const targetName =
    selectedManagerAgreement.targetName.trim() ||
    tPendingTranslation(
      'Target {id}',
      'Fallback revenue share agreement target name shown when no resolved name is available.',
      translationKey('Label.TargetWithId', TranslationNamespace.RevenueShareAgreements),
      { id: selectedManagerAgreement.target.id },
    );
  const proposeChangesButton = (
    <Button variant='Emphasis' size='Medium' onClick={handleProposeChanges}>
      {proposeChangesLabel}
    </Button>
  );

  return (
    <>
      <RevShareDetailView
        target={{ id: asNumberTypedId(selectedManagerAgreement.target.id) }}
        targetType={
          selectedManagerAgreement.target.type === RevShareTargetType.Experience
            ? 'Experience'
            : 'Ugc'
        }
        targetName={targetName}
        targetSubtitle={
          selectedManagerAgreement.target.type === RevShareTargetType.Experience
            ? experienceLabel
            : ugcItemLabel
        }
        split={selectedManagerAgreement.active}
        managingGroupParty={resolveGroupParty(managingGroupId)}
        managingGroupSubtitle={managingGroupLabel}
        unallocatedName={unallocatedLabel}
        resolveRecipientParty={resolveRecipientParty}
        currentUserId={currentUserId}
        centerLabel={new Intl.NumberFormat(locale ?? undefined).format(
          MANAGING_GROUP_PARTY_COUNT + selectedManagerAgreement.active.recipients.length,
        )}
        centerSubLabel={totalSplitsLabel}
        headerAction={proposeChangesButton}
        banner={
          selectedManagerAgreement.proposed ? (
            <RevShareBanner
              message={pendingProposalMessage}
              actionLabel={viewProposalDetailsLabel}
              onAction={handleViewPendingDetails}
            />
          ) : undefined
        }
        onBack={handleBack}
      />
      {managedLifecycleAction !== null && managedLifecycleFlow !== null ? (
        <RevShareLifecycleDialog
          open
          title={managedLifecycleTitle}
          closeLabel={lifecycleCloseLabel}
          onClose={handleManagedLifecycleClose}>
          {managedLifecycleFlow}
        </RevShareLifecycleDialog>
      ) : null}
    </>
  );
};

export default RevShareGroupAgreementsContainer;
