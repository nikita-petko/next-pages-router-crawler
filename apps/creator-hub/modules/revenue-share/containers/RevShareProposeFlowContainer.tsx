// Loads eligible revenue share targets and recipients, hydrates selected agreements, and submits validated split proposals.
import { useCallback, useEffect, useMemo, useRef, useState, type FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import { Surface } from '@rbx/client-universes-api/v1';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useOwner from '@modules/experience-analytics-shared/context/useOwner';
import usePaginatedSearchUniverses from '@modules/experience-analytics-shared/hooks/usePaginatedSearchUniverses';
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
  RevShareRecipientType,
  RevShareTargetType,
  type ManagerAgreement,
  type RevShareRecipientAllocation,
  type RevShareTarget,
} from '../interface/RevShareViewModel';
import { getRevShareByTarget } from '../queries/revShareApi';
import {
  useRevShareForManager,
  useRevShareProposalMutations,
  useRevShareRecipientNames,
} from '../queries/revShareQueries';
import { useRevShareRecipientSearch } from '../queries/useRevShareRecipientSearch';
import { useRevShareUgcTargets } from '../queries/useRevShareUgcTargets';
import { getRevShareRecipientKey } from '../utils/revShareUtils';

const MANAGING_GROUP_ROW_KEY = 'managing-group';
const TOTAL_BASIS_POINTS = 10_000;
const TARGET_PAGE_SIZE = 100;

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
  const managingGroup = useOwner();
  const {
    data: targetData,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
  } = usePaginatedSearchUniverses({
    owner: managingGroup,
    pageSizeOptions: [TARGET_PAGE_SIZE],
    defaultPageSize: TARGET_PAGE_SIZE,
    surface: Surface.CreatorHubGroupPayout,
  });
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
  const ugcTargetsQuery = useRevShareUgcTargets({
    managingGroupId,
    enabled: mode === 'create' && target === null && targetTab === 'ugc',
  });
  const recipientSearch = useRevShareRecipientSearch({
    managingGroupId,
    keyword: recipientQuery,
  });
  const { propose } = useRevShareProposalMutations(managingGroupId);
  const { showSuccess, showError } = useRevShareFeedback();
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
      (targetData?.data ?? []).flatMap((universe) =>
        universe.id == null
          ? []
          : [
              toPickerRow(
                {
                  target: {
                    type: RevShareTargetType.Experience,
                    id: String(universe.id),
                  },
                  targetName: universe.name ?? String(universe.id),
                },
                agreementMap.get(`${RevShareTargetType.Experience}:${String(universe.id)}`),
              ),
            ],
      ),
    [agreementMap, targetData?.data],
  );
  const ugcRows = useMemo<ManagerAgreement[]>(
    () =>
      (ugcTargetsQuery.data?.pages ?? []).flatMap((page) =>
        page.items.map((item) =>
          toPickerRow(
            { target: item.target, targetName: item.targetName },
            agreementMap.get(toTargetKey(item.target)),
          ),
        ),
      ),
    [agreementMap, ugcTargetsQuery.data?.pages],
  );
  const targetRows = useMemo<ManagerAgreement[]>(
    () => [...experienceRows, ...ugcRows],
    [experienceRows, ugcRows],
  );
  const hasLoadedUgcPages = (ugcTargetsQuery.data?.pages.length ?? 0) > 0;
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
        };
      }),
    ];
  }, [
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
      try {
        const result = await propose.mutateAsync({
          target: target.target,
          activeRevShareId: target.activeId,
          allocations: [...allocations],
          allocateUnallocated: target.active.unallocatedBasisPoints > 0,
        });
        if (!result.updateSucceeded) {
          showError('propose');
          return;
        }
        showSuccess('propose');
        onProposeSuccess();
      } catch {
        showError('propose');
      }
    },
    [onProposeSuccess, propose, showError, showSuccess, target],
  );
  useEffect(() => {
    if (!shouldHydrateTarget || existingAgreement == null || target !== null) {
      return undefined;
    }

    let cancelled = false;
    void getRevShareByTarget(existingAgreement.target)
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
  }, [existingAgreement, shouldHydrateTarget, showError, target, targetHydrationAttempt]);

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
        const hydratedAgreement = await getRevShareByTarget(row.target);
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
    [onTargetSelected, showError],
  );

  if (mode === 'create' && target === null) {
    if (isDataLoading || managerQuery.isLoading || isTargetHydrating) {
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
    if (targetTab === 'experiences' && (isResponseFailed || isUserForbidden)) {
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
        isUgcLoading={ugcTargetsQuery.isLoading && !hasLoadedUgcPages}
        ugcError={ugcTargetsQuery.error instanceof Error ? ugcTargetsQuery.error : null}
        onRetryUgc={() => {
          void ugcTargetsQuery.refetch();
        }}
        hasNextUgcPage={ugcTargetsQuery.hasNextPage ?? false}
        isFetchingNextUgcPage={ugcTargetsQuery.isFetchingNextPage}
        onLoadNextUgcPage={() => {
          void ugcTargetsQuery.fetchNextPage();
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
      isSubmitting={propose.isPending}
      presentation='page'
      onStepChange={onStepChange}
    />
  );
};

export default RevShareProposeFlowContainer;
