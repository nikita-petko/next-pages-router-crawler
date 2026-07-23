// Defines the authenticated group revenue share agreements page with feature gating, list-detail navigation, proposal creation, and party resolution.
import { useCallback, useEffect, useMemo, useState, type FunctionComponent } from 'react';
import type { NextLayoutPage } from 'next';
import { useFlag } from '@rbx/flags';
import { Button } from '@rbx/foundation-ui';
import { useLocalization, useTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import { isRevenueShareAgreementsEnabled } from '@generated/flags/creatorBusiness';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import Authenticated from '@modules/authentication/Authenticated';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import getOrganizationLayout from '@modules/group/layout/getOrganizationLayout';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RevShareBanner from '@modules/revenue-share/components/RevShareBanner';
import RevShareDetailView from '@modules/revenue-share/components/RevShareDetailView';
import RevShareLandingView from '@modules/revenue-share/components/RevShareLandingView';
import RevSharePendingProposalFlow from '@modules/revenue-share/components/RevSharePendingProposalFlow';
import RevShareProposeFlowContainer from '@modules/revenue-share/containers/RevShareProposeFlowContainer';
import type {
  ManagerAgreement,
  RecipientAgreement,
} from '@modules/revenue-share/interface/RevShareViewModel';
import { RevShareTargetType } from '@modules/revenue-share/interface/RevShareViewModel';
import {
  useRevShareForManager,
  useRevShareRecipientNames,
} from '@modules/revenue-share/queries/revShareQueries';
import { asNumberTypedId } from '@modules/revenue-share/utils/revShareUtils';
import { emptyManagerAgreement } from '@modules/revenue-share/utils/revShareViewMapper';

const EMPTY_MANAGER_ROWS: ManagerAgreement[] = [];
const EMPTY_RECIPIENT_ROWS: RecipientAgreement[] = [];
const QUERY_KEYS = ['targetType', 'targetId', 'action'] as const;
const QUERY_TRANSITION_OPTIONS = { scroll: false } as const;
const MANAGING_GROUP_PARTY_COUNT = 1;

type RevShareAction = 'create' | 'propose' | 'cancel';

const isRevShareAction = (value: unknown): value is RevShareAction =>
  value === 'create' || value === 'propose' || value === 'cancel';

const parseTargetType = (value: string | null): RevShareTargetType | null => {
  if (value === RevShareTargetType.Experience) {
    return RevShareTargetType.Experience;
  }
  if (value === RevShareTargetType.Ugc) {
    return RevShareTargetType.Ugc;
  }
  return null;
};

const ManagedRevShareAgreementsTitle: FunctionComponent = () => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  return (
    <>
      {tPendingTranslation(
        'Revenue Share Agreements',
        'Layout title for the managed (group) revenue share agreements page.',
        translationKey(
          'Heading.ManagedRevenueShareAgreements',
          TranslationNamespace.RevenueShareAgreements,
        ),
      )}
    </>
  );
};

const RevShareGroupContainer: FunctionComponent = () => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { locale } = useLocalization();
  const { organization, isOrganizationLoading, refreshOrganization } = useCurrentOrganization();
  const managingGroupId = organization?.groupId;
  const managerQuery = useRevShareForManager(managingGroupId);
  const [{ targetType, targetId, action }, setQuery] = useQueryParams(
    QUERY_KEYS,
    QUERY_TRANSITION_OPTIONS,
  );
  const [focusReturnTarget, setFocusReturnTarget] = useState<ManagerAgreement['target'] | null>(
    null,
  );
  const [isCancelTermsAccepted, setIsCancelTermsAccepted] = useState(false);
  const selectedTargetType = typeof targetType === 'string' ? targetType : null;
  const selectedTargetId = typeof targetId === 'string' ? targetId : null;
  const selectedAction = isRevShareAction(action) ? action : null;
  const parsedTargetType = parseTargetType(selectedTargetType);
  const selectedAgreement = useMemo(() => {
    if (!parsedTargetType || !selectedTargetId) {
      return null;
    }
    const found =
      managerQuery.data?.find(
        (agreement) =>
          agreement.target.type === parsedTargetType && agreement.target.id === selectedTargetId,
      ) ?? null;
    if (found) {
      return found;
    }
    if (selectedAction === 'propose' || selectedAction === 'cancel') {
      return emptyManagerAgreement({ type: parsedTargetType, id: selectedTargetId });
    }
    return null;
  }, [managerQuery.data, parsedTargetType, selectedAction, selectedTargetId]);
  const hasTargetQuery = targetType != null || targetId != null;
  const hasActionQuery = action != null;
  const detailRecipients = useMemo(
    () => [
      ...(selectedAgreement?.active.recipients ?? []).map(({ recipient }) => recipient),
      ...(selectedAgreement?.proposed?.split.recipients ?? []).map(
        (allocation) => allocation.recipient,
      ),
    ],
    [selectedAgreement],
  );
  const detailManagingGroupIds = useMemo(
    () =>
      managingGroupId &&
      (selectedAgreement !== null || selectedAction === 'create' || selectedAction === 'propose')
        ? [managingGroupId]
        : [],
    [managingGroupId, selectedAction, selectedAgreement],
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
    'Label for the group that owns a revenue share agreement target.',
    translationKey('Label.ManagingGroup', TranslationNamespace.RevenueShareAgreements),
  );
  const unallocatedLabel = tPendingTranslation(
    'Unallocated',
    'Label for the unallocated percentage in a revenue share agreement.',
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

  useEffect(() => {
    if (
      isOrganizationLoading ||
      managerQuery.isLoading ||
      managerQuery.error ||
      arePartyNamesLoading ||
      partyNamesError ||
      !managingGroupId
    ) {
      return;
    }

    const normalize = (next: Partial<Record<(typeof QUERY_KEYS)[number], string | undefined>>) => {
      setQuery(next, { skipHistory: true });
    };

    if (hasActionQuery && !isRevShareAction(action)) {
      normalize({ action: undefined });
      return;
    }
    if (selectedAction === 'create' && hasTargetQuery) {
      normalize({ targetType: undefined, targetId: undefined });
      return;
    }
    if ((selectedAction === 'propose' || selectedAction === 'cancel') && !selectedAgreement) {
      normalize({ action: undefined, targetType: undefined, targetId: undefined });
      return;
    }
    if (selectedAction === 'cancel' && selectedAgreement?.proposed === null) {
      normalize({ action: 'propose' });
      return;
    }
    if (hasTargetQuery && (!parsedTargetType || !selectedTargetId)) {
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
    parsedTargetType,
    selectedAction,
    selectedAgreement,
    selectedTargetId,
    setQuery,
  ]);

  const handleManagerRowClick = useCallback(
    (agreement: ManagerAgreement) => {
      setFocusReturnTarget(agreement.target);
      setQuery({
        targetType: agreement.target.type,
        targetId: agreement.target.id,
        action: undefined,
      });
    },
    [setQuery],
  );
  const handleBack = useCallback(() => {
    if (selectedAgreement) {
      setFocusReturnTarget(selectedAgreement.target);
    }
    setQuery({ targetType: undefined, targetId: undefined, action: undefined });
  }, [selectedAgreement, setQuery]);
  const handleNewAgreement = useCallback(() => {
    setQuery({ action: 'create', targetType: undefined, targetId: undefined });
  }, [setQuery]);
  const handleProposeChanges = useCallback(() => {
    if (!selectedAgreement) {
      return;
    }
    setQuery({
      targetType: selectedAgreement.target.type,
      targetId: selectedAgreement.target.id,
      action: 'propose',
    });
  }, [selectedAgreement, setQuery]);
  const handleViewPendingDetails = useCallback(() => {
    handleProposeChanges();
  }, [handleProposeChanges]);
  const handleTargetSelected = useCallback(
    (target: ManagerAgreement['target']) => {
      setQuery({
        targetType: target.type,
        targetId: target.id,
        action: 'propose',
      });
    },
    [setQuery],
  );
  const handleCreateExit = useCallback(() => {
    setQuery({ action: undefined, targetType: undefined, targetId: undefined });
  }, [setQuery]);
  const handleProposeExit = useCallback(() => {
    if (!selectedAgreement) {
      setQuery({ action: undefined, targetType: undefined, targetId: undefined });
      return;
    }
    setQuery({
      targetType: selectedAgreement.target.type,
      targetId: selectedAgreement.target.id,
      action: undefined,
    });
  }, [selectedAgreement, setQuery]);
  const handlePendingBack = useCallback(() => {
    handleProposeExit();
  }, [handleProposeExit]);
  const handleCancelProposal = useCallback(() => {
    if (!selectedAgreement) {
      return;
    }
    setIsCancelTermsAccepted(false);
    setQuery({
      targetType: selectedAgreement.target.type,
      targetId: selectedAgreement.target.id,
      action: 'cancel',
    });
  }, [selectedAgreement, setQuery]);
  const handleCancelTermsBack = useCallback(() => {
    if (!selectedAgreement) {
      return;
    }
    setQuery({
      targetType: selectedAgreement.target.type,
      targetId: selectedAgreement.target.id,
      action: 'propose',
    });
  }, [selectedAgreement, setQuery]);
  const handleCancelSuccess = useCallback(() => {
    setIsCancelTermsAccepted(false);
    handleProposeExit();
  }, [handleProposeExit]);

  if (isOrganizationLoading || managerQuery.isLoading || arePartyNamesLoading) {
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
  if (partyNamesError) {
    return <LoadError onReload={refetchPartyNames} />;
  }

  const managingGroupName = resolveGroupParty(managingGroupId, managingGroupLabel).name;

  if (selectedAction === 'create') {
    return (
      <RevShareProposeFlowContainer
        managingGroupId={managingGroupId}
        managingGroupName={managingGroupName}
        managingGroupSubtitle={managingGroupLabel}
        mode='create'
        onTargetSelected={handleTargetSelected}
        onExit={handleCreateExit}
        onProposeSuccess={handleProposeExit}
      />
    );
  }

  if (
    selectedAction === 'propose' &&
    selectedAgreement !== null &&
    selectedAgreement.proposed !== null
  ) {
    return (
      <RevSharePendingProposalFlow
        managingGroupId={managingGroupId}
        managingGroupName={managingGroupName}
        managingGroupSubtitle={managingGroupLabel}
        agreement={selectedAgreement}
        resolveRecipientParty={resolveRecipientParty}
        action='propose'
        isTermsAccepted={isCancelTermsAccepted}
        onTermsAcceptedChange={setIsCancelTermsAccepted}
        onBack={handlePendingBack}
        onCancelProposal={handleCancelProposal}
        onCancelTermsBack={handleCancelTermsBack}
        onDone={handleCancelSuccess}
      />
    );
  }

  if (
    selectedAction === 'cancel' &&
    selectedAgreement !== null &&
    selectedAgreement.proposed !== null
  ) {
    return (
      <RevSharePendingProposalFlow
        managingGroupId={managingGroupId}
        managingGroupName={managingGroupName}
        managingGroupSubtitle={managingGroupLabel}
        agreement={selectedAgreement}
        resolveRecipientParty={resolveRecipientParty}
        action='cancel'
        isTermsAccepted={isCancelTermsAccepted}
        onTermsAcceptedChange={setIsCancelTermsAccepted}
        onBack={handlePendingBack}
        onCancelProposal={handleCancelProposal}
        onCancelTermsBack={handleCancelTermsBack}
        onDone={handleCancelSuccess}
      />
    );
  }

  if (selectedAction === 'propose' && selectedAgreement) {
    return (
      <RevShareProposeFlowContainer
        managingGroupId={managingGroupId}
        managingGroupName={managingGroupName}
        managingGroupSubtitle={managingGroupLabel}
        mode='propose'
        existingAgreement={selectedAgreement}
        onTargetSelected={handleTargetSelected}
        onExit={handleProposeExit}
        onProposeSuccess={handleProposeExit}
      />
    );
  }

  if (!selectedAgreement) {
    return (
      <RevShareLandingView
        managerRows={managerQuery.data ?? EMPTY_MANAGER_ROWS}
        recipientRows={EMPTY_RECIPIENT_ROWS}
        onManagerRowClick={handleManagerRowClick}
        onNewAgreement={handleNewAgreement}
        focusTarget={focusReturnTarget}
      />
    );
  }

  const targetName =
    selectedAgreement.targetName.trim() ||
    tPendingTranslation(
      'Target {id}',
      'Fallback revenue share agreement target name shown when no resolved name is available.',
      translationKey('Label.TargetWithId', TranslationNamespace.RevenueShareAgreements),
      { id: selectedAgreement.target.id },
    );

  return (
    <RevShareDetailView
      target={{ id: asNumberTypedId(selectedAgreement.target.id) }}
      targetType={
        selectedAgreement.target.type === RevShareTargetType.Experience ? 'Experience' : 'Ugc'
      }
      targetName={targetName}
      targetSubtitle={
        selectedAgreement.target.type === RevShareTargetType.Experience
          ? experienceLabel
          : ugcItemLabel
      }
      split={selectedAgreement.active}
      managingGroupParty={resolveGroupParty(managingGroupId)}
      managingGroupSubtitle={managingGroupLabel}
      unallocatedName={unallocatedLabel}
      resolveRecipientParty={resolveRecipientParty}
      centerLabel={new Intl.NumberFormat(locale ?? undefined).format(
        MANAGING_GROUP_PARTY_COUNT + selectedAgreement.active.recipients.length,
      )}
      centerSubLabel={totalSplitsLabel}
      headerAction={
        <Button
          variant='Emphasis'
          size='Medium'
          isDisabled={selectedAgreement.proposed !== null}
          onClick={handleProposeChanges}>
          {tPendingTranslation(
            'Propose changes',
            'Button label to propose a new revenue share split.',
            translationKey('Action.ProposeChanges', TranslationNamespace.RevenueShareAgreements),
          )}
        </Button>
      }
      banner={
        selectedAgreement.proposed ? (
          <RevShareBanner
            message={tPendingTranslation(
              'Pending change request',
              'Banner shown while a revenue share proposal is awaiting responses.',
              translationKey(
                'Message.PendingChangeRequest',
                TranslationNamespace.RevenueShareAgreements,
              ),
            )}
            action={
              <Button variant='Standard' size='Medium' onClick={handleViewPendingDetails}>
                {tPendingTranslation(
                  'View details',
                  'Button label to review or cancel a pending revenue share proposal.',
                  translationKey(
                    'Action.ViewProposalDetails',
                    TranslationNamespace.RevenueShareAgreements,
                  ),
                )}
              </Button>
            }
          />
        ) : undefined
      }
      onBack={handleBack}
    />
  );
};

const RevShareGroupPage: NextLayoutPage = () => {
  const { ready, value: isEnabled } = useFlag(isRevenueShareAgreementsEnabled);
  if (!ready) {
    return <PageLoading />;
  }
  if (!isEnabled) {
    return <PageNotFound />;
  }
  return (
    <Authenticated>
      <RevShareGroupContainer />
    </Authenticated>
  );
};

RevShareGroupPage.getPageLayout = (page) =>
  getOrganizationLayout(page, {
    title: <ManagedRevShareAgreementsTitle />,
    financeRail: true,
  });
RevShareGroupPage.loggerConfig = { rosId: RosTeams.CreatorBusiness };

export default RevShareGroupPage;
