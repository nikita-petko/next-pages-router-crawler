import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ShowcaseContentReferenceRequest,
  ShowcaseRejectedContentResponse,
} from '@rbx/client-content-licensing-api/v1';
import loadErrorDark from '@rbx/foundation-images/pictograms/alert_dark.svg';
import loadErrorLight from '@rbx/foundation-images/pictograms/alert_light.svg';
import experiencesDark from '@rbx/foundation-images/pictograms/video_game_dark.svg';
import experiencesLight from '@rbx/foundation-images/pictograms/video_game_light.svg';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { CircularProgress, makeStyles } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ThemedImage from '@modules/miscellaneous/components/ThemedImage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ShowcaseContentTile from '../../components/ShowcaseContentTile';
import { EXTERNAL_EXPERIENCE_HREF } from '../../urls';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
} from '../../utils/logger';
import useGetShowcaseUniverseDetails from '../hooks/useGetShowcaseUniverseDetails';
import useListShowcaseEligibleContentByListing from '../hooks/useListShowcaseEligibleContentByListing';
import useReplaceListingShowcaseContentMutation from '../hooks/useReplaceListingShowcaseContentMutation';
import { parseShowcaseSaveError } from '../utils/parseShowcaseSaveError';

type ShowcasedExperiencesDialogProps = {
  open: boolean;
  listingId: string;
  selectedContent?: ShowcaseContentReferenceRequest[];
  ifMatch: string | undefined;
  onClose: () => void;
};

const EMPTY_SELECTED_CONTENT: ShowcaseContentReferenceRequest[] = [];
// A tile row is 168px tall. The maximum shows two full rows, two 16px gaps,
// and half of a third row to communicate that the viewport is scrollable.
const CONTENT_VIEWPORT_CLASS = 'width-full min-height-[168px] max-height-[452px]';
const MAX_SHOWCASE_SELECTIONS = 10;
const MAX_FULLY_VISIBLE_TILE_COUNT = 10;
const SHOWCASE_ELIGIBLE_CONTENT_PAGE_SIZE = 500;
const CONFIRMED_INELIGIBLE_REASONS = new Set([
  'missing_licensing_coverage',
  'not_publicly_displayable',
  'malformed_content_id',
]);
const INDETERMINATE_REASONS = new Set([
  'indeterminate_universe_metadata',
  'indeterminate_licensing_data',
  'indeterminate_evaluation',
]);

type SaveErrorKind = 'confirmed-ineligible' | 'indeterminate' | 'generic';

type SaveFailureKind =
  | 'confirmed_ineligible'
  | 'indeterminate'
  | 'dependency_unavailable'
  | 'rate_limited'
  | 'timeout'
  | 'conflict'
  | 'generic';

type SaveErrorMessageVariant = 'confirmed_ineligible' | 'verification_failed' | 'generic';

const getUniverseIds = (
  content: Array<{ contentType?: string | null; contentId?: string | null }> | null | undefined,
) =>
  content?.flatMap((reference) => {
    const universeId = Number(reference.contentId);
    return reference.contentType === 'Universe' &&
      Number.isSafeInteger(universeId) &&
      universeId > 0
      ? [universeId]
      : [];
  }) ?? [];

const useStyles = makeStyles()((theme) => ({
  tileViewport: {
    scrollbarColor: 'var(--color-shift-400) var(--color-shift-100)',
    scrollbarGutter: 'stable',
    scrollbarWidth: 'thin',
    '&::-webkit-scrollbar': {
      WebkitAppearance: 'none',
      display: 'block',
      width: 10,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'var(--color-shift-400)',
      borderRadius: 4,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'var(--color-shift-100)',
      borderRadius: 4,
    },
  },
  selectableTile: {
    boxShadow: 'inset 0 0 0 2px transparent',
    '&:hover': {
      boxShadow: `inset 0 0 0 2px ${theme.palette.states.selected}`,
    },
  },
  selectedTile: {
    boxShadow: `inset 0 0 0 2px ${theme.palette.components.input.outlined.focusBorder}`,
    '&:hover': {
      boxShadow: `inset 0 0 0 2px ${theme.palette.components.input.outlined.focusBorder}`,
    },
  },
  rejectedTile: {
    boxShadow: `inset 0 0 0 2px ${theme.palette.actionV2.important.fill}`,
    '&:hover': {
      boxShadow: `inset 0 0 0 2px ${theme.palette.actionV2.important.fill}`,
    },
  },
  unselectedCheckbox: {
    boxShadow: `inset 0 0 0 2px ${theme.palette.common.white}`,
    '& [data-slot="checkbox"]': {
      opacity: 0,
    },
  },
  saveError: {
    marginBottom: theme.spacing(1),
  },
  dialogLayout: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  dialogBody: {
    flex: '1 1 auto',
    minHeight: 0,
    overflow: 'hidden',
  },
  dialogFooter: {
    flexShrink: 0,
  },
}));

const ShowcasedExperiencesDialog = ({
  open,
  listingId,
  selectedContent = EMPTY_SELECTED_CONTENT,
  ifMatch,
  onClose,
}: ShowcasedExperiencesDialogProps) => {
  const { classes, cx } = useStyles();
  const { logEvent } = useLicenseManagerLogger();
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const showcaseEligibleContentReq = useListShowcaseEligibleContentByListing({
    listingId,
    pageSize: SHOWCASE_ELIGIBLE_CONTENT_PAGE_SIZE,
    enabled: open,
  });
  const selectedContentUniverseIds = useMemo(
    () => getUniverseIds(selectedContent),
    [selectedContent],
  );
  const eligibleUniverseIds = useMemo(
    () => [...new Set(getUniverseIds(showcaseEligibleContentReq.data?.content))],
    [showcaseEligibleContentReq.data?.content],
  );
  const initialSelectedUniverseIds = useMemo(
    () => [...new Set(selectedContentUniverseIds)],
    [selectedContentUniverseIds],
  );
  const [selectedUniverseIdsOverride, setSelectedUniverseIds] = useState<number[] | null>(null);
  const [confirmedRejectedUniverseIds, setConfirmedRejectedUniverseIds] = useState<number[]>([]);
  const [saveErrorKind, setSaveErrorKind] = useState<SaveErrorKind | null>(null);
  const [rejectionSequence, setRejectionSequence] = useState(0);
  const selectedUniverseIds = selectedUniverseIdsOverride ?? initialSelectedUniverseIds;
  const confirmedRejectedUniverseIdSet = useMemo(
    () => new Set(confirmedRejectedUniverseIds),
    [confirmedRejectedUniverseIds],
  );
  const selectableUniverseIds = useMemo(
    () => [
      ...new Set([
        ...initialSelectedUniverseIds.filter(
          (universeId) =>
            !confirmedRejectedUniverseIdSet.has(universeId) ||
            selectedUniverseIds.includes(universeId),
        ),
        ...eligibleUniverseIds.filter(
          (universeId) =>
            !confirmedRejectedUniverseIdSet.has(universeId) ||
            selectedUniverseIds.includes(universeId),
        ),
      ]),
    ],
    [
      confirmedRejectedUniverseIdSet,
      eligibleUniverseIds,
      initialSelectedUniverseIds,
      selectedUniverseIds,
    ],
  );
  const selectedConfirmedRejectedUniverseIds = useMemo(
    () =>
      selectedUniverseIds.filter((universeId) => confirmedRejectedUniverseIdSet.has(universeId)),
    [confirmedRejectedUniverseIdSet, selectedUniverseIds],
  );
  const dialogLayoutRef = useRef<HTMLDivElement>(null);
  const submittedUniverseIdsRef = useRef<number[]>([]);
  const previousSaveErrorKindRef = useRef<SaveFailureKind | null>(null);
  const hasLoggedMissingETagImpressionRef = useRef(false);
  const hasLoggedScrollableContentImpressionRef = useRef(false);
  const contentGridRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef(new Map<number, HTMLDivElement>());
  const showcaseUniverseDetailsReq = useGetShowcaseUniverseDetails({
    universeIds: selectableUniverseIds,
    enabled: open,
  });
  const detailsByUniverseId = useMemo(
    () =>
      new Map(
        (showcaseUniverseDetailsReq.data?.data ?? []).flatMap((details) =>
          details.id == null ? [] : [[details.id, details] as const],
        ),
      ),
    [showcaseUniverseDetailsReq.data?.data],
  );
  const isContentError =
    showcaseEligibleContentReq.isError ||
    (selectableUniverseIds.length > 0 && showcaseUniverseDetailsReq.isError);
  const failedShowcaseRequest =
    showcaseEligibleContentReq.isError && showcaseUniverseDetailsReq.isError
      ? 'eligible_content_and_universe_details'
      : showcaseEligibleContentReq.isError
        ? 'eligible_content'
        : 'universe_details';
  const isContentRetrying =
    isContentError &&
    (showcaseEligibleContentReq.isFetching || showcaseUniverseDetailsReq.isFetching);
  const isContentLoading =
    showcaseEligibleContentReq.isPending ||
    (selectableUniverseIds.length > 0 && showcaseUniverseDetailsReq.isPending) ||
    isContentRetrying;
  const replaceShowcaseContent = useReplaceListingShowcaseContentMutation({
    listingId,
    onSuccess: () => {
      const submittedUniverseIds = submittedUniverseIdsRef.current;
      logEvent(
        LicenseManagerImpressionEvent.IphListingsDetailsPageSaveShowcasedExperiencesSuccessImpressionEvent,
        {
          listingId,
          selectedCount: submittedUniverseIds.length,
          universeIds: submittedUniverseIds.join(','),
          previousSaveErrorKind: previousSaveErrorKindRef.current ?? 'none',
        },
      );
      dialogLayoutRef.current?.style.removeProperty('height');
      onClose();
    },
    onError: async (error) => {
      const { status, body } = await parseShowcaseSaveError(error);
      const rejectedContent: ShowcaseRejectedContentResponse[] =
        body?.errorCategory === 'content_not_eligible' ? (body.rejectedContent ?? []) : [];
      const reasonCounts = new Map<string, number>();
      rejectedContent.forEach(({ reason }) => {
        if (reason) {
          reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
        }
      });
      const confirmedRejectedIds = [
        ...new Set(
          getUniverseIds(
            rejectedContent.filter(
              ({ reason }) => reason != null && CONFIRMED_INELIGIBLE_REASONS.has(reason),
            ),
          ),
        ),
      ];
      const hasConfirmedIneligibleRejection = rejectedContent.some(
        ({ reason }) => reason != null && CONFIRMED_INELIGIBLE_REASONS.has(reason),
      );
      const hasIndeterminateRejection = rejectedContent.some(
        ({ reason }) => reason != null && INDETERMINATE_REASONS.has(reason),
      );
      const hasDependencyUnavailable =
        status === 503 && body?.errorCategory === 'eligibility_dependency_unavailable';
      const saveFailureKind: SaveFailureKind = hasConfirmedIneligibleRejection
        ? 'confirmed_ineligible'
        : hasIndeterminateRejection
          ? 'indeterminate'
          : hasDependencyUnavailable
            ? 'dependency_unavailable'
            : status === 429
              ? 'rate_limited'
              : status === 504
                ? 'timeout'
                : status === 409
                  ? 'conflict'
                  : 'generic';
      const nextSaveErrorKind: SaveErrorKind = hasConfirmedIneligibleRejection
        ? 'confirmed-ineligible'
        : hasIndeterminateRejection || hasDependencyUnavailable
          ? 'indeterminate'
          : 'generic';
      const messageVariant: SaveErrorMessageVariant =
        nextSaveErrorKind === 'confirmed-ineligible'
          ? 'confirmed_ineligible'
          : nextSaveErrorKind === 'indeterminate'
            ? 'verification_failed'
            : 'generic';
      const confirmedIneligibleCount = rejectedContent.filter(
        ({ reason }) => reason != null && CONFIRMED_INELIGIBLE_REASONS.has(reason),
      ).length;
      const indeterminateCount = rejectedContent.filter(
        ({ reason }) => reason != null && INDETERMINATE_REASONS.has(reason),
      ).length;
      const unknownReasonCount =
        rejectedContent.length - confirmedIneligibleCount - indeterminateCount;

      setConfirmedRejectedUniverseIds(confirmedRejectedIds);
      setSaveErrorKind(nextSaveErrorKind);
      previousSaveErrorKindRef.current = saveFailureKind;
      if (confirmedRejectedIds.length > 0) {
        setRejectionSequence((sequence) => sequence + 1);
      }

      const analyticsParameters = {
        listingId,
        selectedCount: submittedUniverseIdsRef.current.length,
        universeIds: submittedUniverseIdsRef.current.join(','),
        failureStatus: status ?? 'unknown',
        failureReason: body?.failureReason ?? 'unknown',
        errorCategory: body?.errorCategory ?? 'unknown',
        saveErrorKind: saveFailureKind,
        messageVariant,
        rejectedContentCount: rejectedContent.length,
        confirmedIneligibleCount,
        indeterminateCount,
        unknownReasonCount,
        rejectionReasonCounts: [...reasonCounts.entries()]
          .map(([reason, count]) => `${reason}:${count.toString()}`)
          .join(','),
        rejectedContentIds: rejectedContent
          .flatMap(({ contentId }) => (contentId == null ? [] : [contentId]))
          .join(','),
      };
      logEvent(
        LicenseManagerImpressionEvent.IphListingsDetailsPageSaveShowcasedExperiencesFailureImpressionEvent,
        analyticsParameters,
      );
      if (nextSaveErrorKind === 'confirmed-ineligible') {
        logEvent(
          LicenseManagerImpressionEvent.IphListingsDetailsPageConfirmedIneligibleShowcasedExperiencesAlertImpressionEvent,
          analyticsParameters,
        );
      } else if (nextSaveErrorKind === 'indeterminate') {
        logEvent(
          LicenseManagerImpressionEvent.IphListingsDetailsPageIndeterminateShowcasedExperiencesAlertImpressionEvent,
          analyticsParameters,
        );
      }
    },
    onConflict: ({ latestContent, refreshSucceeded }) => {
      const latestUniverseIds = getUniverseIds(latestContent?.content);
      const submittedUniverseIds = submittedUniverseIdsRef.current;
      const selectionsChanged = refreshSucceeded
        ? latestUniverseIds.length !== submittedUniverseIds.length ||
          latestUniverseIds.some((universeId, index) => universeId !== submittedUniverseIds[index])
        : 'unknown';
      logEvent(
        LicenseManagerImpressionEvent.IphListingsDetailsPageShowcaseConflictRecoveryImpressionEvent,
        {
          listingId,
          refreshResult: refreshSucceeded ? 'success' : 'failure',
          selectionsChanged,
          submittedCount: submittedUniverseIds.length,
          refreshedCount: latestUniverseIds.length,
        },
      );
      if (latestContent) {
        setSelectedUniverseIds(latestUniverseIds);
        setConfirmedRejectedUniverseIds([]);
        setSaveErrorKind(null);
      }
    },
  });
  const toggleSelection = useCallback(
    (universeId: number) => {
      const isSelected = selectedUniverseIds.includes(universeId);
      if (!isSelected && selectedUniverseIds.length >= MAX_SHOWCASE_SELECTIONS) {
        return;
      }

      const nextSelectedUniverseIds = isSelected
        ? selectedUniverseIds.filter((selectedUniverseId) => selectedUniverseId !== universeId)
        : [...selectedUniverseIds, universeId];
      replaceShowcaseContent.reset();
      if (
        !nextSelectedUniverseIds.some((selectedUniverseId) =>
          confirmedRejectedUniverseIdSet.has(selectedUniverseId),
        )
      ) {
        setSaveErrorKind(null);
      } else if (saveErrorKind !== 'confirmed-ineligible') {
        setSaveErrorKind(null);
      }
      setSelectedUniverseIds(nextSelectedUniverseIds);
      logEvent(LicenseManagerClickEvent.IphListingsDetailsPageToggleShowcasedExperienceClickEvent, {
        listingId,
        contentType: 'Universe',
        contentId: universeId,
        action: isSelected ? 'deselect' : 'select',
        selectedCount: nextSelectedUniverseIds.length,
      });
    },
    [
      confirmedRejectedUniverseIdSet,
      listingId,
      logEvent,
      replaceShowcaseContent,
      saveErrorKind,
      selectedUniverseIds,
    ],
  );

  const closeDialog = (action: 'cancel' | 'dismiss') => {
    logEvent(LicenseManagerClickEvent.IphListingsDetailsPageCloseShowcasedExperiencesClickEvent, {
      listingId,
      action,
      selectedCount: selectedUniverseIds.length,
    });
    dialogLayoutRef.current?.style.removeProperty('height');
    onClose();
  };

  const handleCancel = () => {
    closeDialog('cancel');
  };

  const handleDeselectAll = () => {
    logEvent(
      LicenseManagerClickEvent.IphListingsDetailsPageDeselectAllShowcasedExperiencesClickEvent,
      {
        listingId,
        selectedCount: selectedUniverseIds.length,
        universeIds: selectedUniverseIds.join(','),
      },
    );
    replaceShowcaseContent.reset();
    setSaveErrorKind(null);
    setSelectedUniverseIds([]);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      closeDialog('dismiss');
    }
  };

  const handleSave = () => {
    if (
      showcaseEligibleContentReq.isPending ||
      showcaseEligibleContentReq.isFetching ||
      selectedConfirmedRejectedUniverseIds.length > 0 ||
      ifMatch == null
    ) {
      return;
    }
    logEvent(LicenseManagerClickEvent.IphListingsDetailsPageSaveShowcasedExperiencesClickEvent, {
      listingId,
      selectedCount: selectedUniverseIds.length,
      universeIds: selectedUniverseIds.join(','),
    });
    const dialogLayout = dialogLayoutRef.current;
    if (dialogLayout) {
      dialogLayout.style.height = `${dialogLayout.getBoundingClientRect().height.toString()}px`;
    }
    submittedUniverseIdsRef.current = [...selectedUniverseIds];
    replaceShowcaseContent.mutate({
      request: {
        content: selectedUniverseIds.map((universeId) => ({
          contentType: 'Universe',
          contentId: universeId.toString(),
        })),
      },
      ifMatch,
    });
  };

  const handleRetry = () => {
    logEvent(LicenseManagerClickEvent.IphListingsDetailsPageRetryShowcasedExperiencesClickEvent, {
      listingId,
      surface: 'dialog',
      failedRequest: failedShowcaseRequest,
    });
    if (showcaseEligibleContentReq.isError) {
      void showcaseEligibleContentReq.refetch();
    }
    if (showcaseUniverseDetailsReq.isError) {
      void showcaseUniverseDetailsReq.refetch();
    }
  };

  const title = tPendingTranslation(
    'Edit featured creations',
    'Title of the dialog for editing featured / spotlighted creations to an IP listing',
    translationKey('Heading.AddSpotlightedCreations', TranslationNamespace.AgreementsManager),
  );
  const description = tPendingTranslation(
    'Creations must be public and have an active agreement to be featured.',
    'Description explaining which creations can be featured / spotlighted on an IP listing',
    translationKey('Description.AddSpotlightedCreations', TranslationNamespace.AgreementsManager),
  );
  const emptyStateTitle = tPendingTranslation(
    'No licensed creations yet',
    'Empty-state heading when an IP listing has no creations with active license agreements',
    translationKey('Heading.NoLicensedCreationsYet', TranslationNamespace.AgreementsManager),
  );
  const emptyStateDescription = tPendingTranslation(
    'No creations are in active license agreement with the licenses for this listing yet',
    'Empty-state description when an IP listing has no creations with active license agreements',
    translationKey('Description.NoLicensedCreationsYet', TranslationNamespace.AgreementsManager),
  );
  const illustrationAlt = tPendingTranslation(
    'Game controller illustration',
    'Alternative text for the showcased experiences empty-state illustration',
    translationKey(
      'Label.ShowcasedExperiencesEmptyStateIllustration',
      TranslationNamespace.AgreementsManager,
    ),
  );
  const cancelLabel = translate(translationKey('Action.Cancel', TranslationNamespace.Controls));
  const addLabel = translate(translationKey('Action.Save', TranslationNamespace.Controls));
  const deselectAllLabel = tPendingTranslation(
    'Deselect all',
    'Action to deselect all spotlighted creations in the selection dialog',
    translationKey('Action.DeselectAll', TranslationNamespace.AgreementsManager),
  );
  const selectedCountLabel = tPendingTranslation(
    '{selectedCount}/{maxSelections} selected.',
    'Count of experiences selected for an IP listing showcase',
    translationKey(
      'Label.ShowcasedExperiencesSelectedCount',
      TranslationNamespace.AgreementsManager,
    ),
    {
      selectedCount: selectedUniverseIds.length.toString(),
      maxSelections: MAX_SHOWCASE_SELECTIONS.toString(),
    },
  );
  const saveErrorMessage = tPendingTranslation(
    "We couldn't save your selections. Try again.",
    'Error shown when showcased experience selections could not be saved',
    translationKey('Error.SaveShowcasedExperiences', TranslationNamespace.AgreementsManager),
  );
  const retryLabel = tPendingTranslation(
    'Retry',
    'Action to retry a failed request',
    translationKey('Action.Retry', TranslationNamespace.AgreementsManager),
  );
  const loadErrorTitle = translate(
    translationKey('Heading.GenericError', TranslationNamespace.Error),
  );
  const loadErrorDescription = tPendingTranslation(
    'Creations failed to load',
    'Description shown when creations fail to load',
    translationKey('Description.CreationsFailedToLoad', TranslationNamespace.AgreementsManager),
  );
  const confirmedIneligibleSaveErrorMessage = tPendingTranslation(
    'Some selected creations are no longer eligible. Please deselect them.',
    'Error shown when selected featured creations are confirmed to be ineligible',
    translationKey(
      'Error.ConfirmedIneligibleShowcasedExperiences',
      TranslationNamespace.AgreementsManager,
    ),
  );
  const indeterminateSaveErrorMessage = tPendingTranslation(
    "We couldn't verify some selected creations. Please try again.",
    'Error shown when featured creation eligibility could not be verified',
    translationKey(
      'Error.IndeterminateShowcasedExperiences',
      TranslationNamespace.AgreementsManager,
    ),
  );
  const displayedSaveErrorMessage =
    saveErrorKind === 'confirmed-ineligible'
      ? confirmedIneligibleSaveErrorMessage
      : saveErrorKind === 'indeterminate'
        ? indeterminateSaveErrorMessage
        : saveErrorMessage;
  const hasRemovedSelections = selectedContentUniverseIds.some(
    (universeId) => !selectedUniverseIds.includes(universeId),
  );
  const isAddDisabled =
    isContentError ||
    showcaseEligibleContentReq.isPending ||
    showcaseEligibleContentReq.isFetching ||
    ifMatch == null ||
    replaceShowcaseContent.isPending ||
    selectedConfirmedRejectedUniverseIds.length > 0 ||
    (selectableUniverseIds.length === 0 && !hasRemovedSelections);
  const hasNonContentState =
    isContentLoading || isContentError || selectableUniverseIds.length === 0;
  const dialogWidthClass = hasNonContentState
    ? 'width-[min(800px,95vw)]'
    : selectableUniverseIds.length <= 3
      ? 'width-[min(496px,95vw)]'
      : selectableUniverseIds.length === 4
        ? 'width-[min(648px,95vw)]'
        : 'width-[min(800px,95vw)]';

  useEffect(() => {
    if (open && ifMatch == null && !hasLoggedMissingETagImpressionRef.current) {
      hasLoggedMissingETagImpressionRef.current = true;
      logEvent(
        LicenseManagerImpressionEvent.IphListingsDetailsPageMissingShowcaseETagImpressionEvent,
        { listingId },
      );
    }
  }, [ifMatch, listingId, logEvent, open]);
  useEffect(() => {
    if (
      open &&
      !showcaseEligibleContentReq.isPending &&
      !showcaseEligibleContentReq.isError &&
      selectableUniverseIds.length === 0
    ) {
      logEvent(
        LicenseManagerImpressionEvent.EmptyStateIphListingsDetailsPageNoLicensedExperiencesImpressionEvent,
        { listingId },
      );
    }
  }, [
    listingId,
    logEvent,
    open,
    selectableUniverseIds.length,
    showcaseEligibleContentReq.isError,
    showcaseEligibleContentReq.isPending,
  ]);
  useEffect(() => {
    if (isContentError) {
      logEvent(
        LicenseManagerImpressionEvent.IphListingsDetailsPageShowcasedExperiencesLoadFailureImpressionEvent,
        {
          listingId,
          surface: 'dialog',
          failedRequest: failedShowcaseRequest,
        },
      );
    }
  }, [failedShowcaseRequest, isContentError, listingId, logEvent]);
  useEffect(() => {
    if (
      open &&
      !isContentLoading &&
      !isContentError &&
      selectableUniverseIds.length > MAX_FULLY_VISIBLE_TILE_COUNT &&
      !hasLoggedScrollableContentImpressionRef.current
    ) {
      hasLoggedScrollableContentImpressionRef.current = true;
      logEvent(
        LicenseManagerImpressionEvent.IphListingsDetailsPageScrollableShowcasedExperiencesImpressionEvent,
        {
          listingId,
          contentCount: selectableUniverseIds.length,
          fullyVisibleTileCount: MAX_FULLY_VISIBLE_TILE_COUNT,
        },
      );
    }
  }, [isContentError, isContentLoading, listingId, logEvent, open, selectableUniverseIds.length]);
  const lastScrolledRejectionSequenceRef = useRef(0);
  useEffect(() => {
    if (rejectionSequence === 0 || rejectionSequence === lastScrolledRejectionSequenceRef.current) {
      return;
    }
    const firstRejectedUniverseId = selectableUniverseIds.find((universeId) =>
      confirmedRejectedUniverseIdSet.has(universeId),
    );
    const contentGrid = contentGridRef.current;
    const firstRejectedTile =
      firstRejectedUniverseId == null ? null : tileRefs.current.get(firstRejectedUniverseId);
    if (!contentGrid || !firstRejectedTile) {
      return;
    }

    lastScrolledRejectionSequenceRef.current = rejectionSequence;
    const contentGridRect = contentGrid.getBoundingClientRect();
    const rejectedTileRect = firstRejectedTile.getBoundingClientRect();
    contentGrid.scrollTo({
      top: Math.max(0, contentGrid.scrollTop + rejectedTileRect.top - contentGridRect.top),
      behavior: 'smooth',
    });
  }, [confirmedRejectedUniverseIdSet, rejectionSequence, selectableUniverseIds]);

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      size='Large'
      isModal
      hasCloseAffordance={false}>
      <DialogContent
        className={`flex flex-col min-width-[min(496px,95vw)] !max-width-[min(800px,95vw)] ${dialogWidthClass}`}
        data-testid='showcase-dialog-content'>
        <div
          ref={dialogLayoutRef}
          className={classes.dialogLayout}
          data-testid='showcase-dialog-layout'>
          <DialogBody className={`${classes.dialogBody} flex flex-col gap-medium`}>
            <div className='flex flex-col gap-xsmall'>
              <DialogTitle className='text-heading-small content-emphasis margin-none'>
                {title}
              </DialogTitle>
              <p className='text-body-medium content-default margin-none'>{description}</p>
              <div className='flex items-center gap-small'>
                <p className='text-body-medium content-default margin-none'>{selectedCountLabel}</p>
                <Button
                  variant='Link'
                  size='Medium'
                  className={selectedUniverseIds.length > 0 ? undefined : '[visibility:hidden]'}
                  aria-hidden={selectedUniverseIds.length === 0}
                  onClick={handleDeselectAll}>
                  {deselectAllLabel}
                </Button>
              </div>
            </div>
            {isContentLoading ? (
              <div
                className={`${CONTENT_VIEWPORT_CLASS} ${
                  replaceShowcaseContent.isError ? '!min-height-0' : ''
                } flex radius-medium stroke-standard stroke-default items-center justify-center`}>
                <CircularProgress />
              </div>
            ) : isContentError ? (
              <div
                className={`${CONTENT_VIEWPORT_CLASS} ${
                  replaceShowcaseContent.isError ? '!min-height-0' : ''
                } flex radius-medium stroke-standard stroke-default flex-col items-center justify-center padding-y-xxlarge padding-x-large`}>
                <ThemedImage lightSrc={loadErrorLight} darkSrc={loadErrorDark} alt='' />
                <div className='flex flex-col items-center gap-small text-align-x-center max-width-[510px]'>
                  <h2 className='text-heading-small content-emphasis margin-none'>
                    {loadErrorTitle}
                  </h2>
                  <p className='text-body-medium content-muted margin-none'>
                    {loadErrorDescription}
                  </p>
                  <Button variant='Emphasis' size='Medium' onClick={handleRetry}>
                    {retryLabel}
                  </Button>
                </div>
              </div>
            ) : selectableUniverseIds.length > 0 ? (
              <div
                ref={contentGridRef}
                className={cx(
                  classes.tileViewport,
                  CONTENT_VIEWPORT_CLASS,
                  replaceShowcaseContent.isError && '!min-height-0',
                  'grid [grid-template-columns:repeat(auto-fill,144px)] [align-content:flex-start] [justify-content:space-between] [overflow-y:auto] gap-y-medium',
                )}
                data-testid='showcase-content-selection-grid'>
                {selectableUniverseIds.map((universeId, index) => {
                  const isSelected = selectedUniverseIds.includes(universeId);
                  const isConfirmedRejected = confirmedRejectedUniverseIdSet.has(universeId);
                  const details = detailsByUniverseId.get(universeId);
                  const name =
                    details?.name ??
                    tPendingTranslation(
                      'Universe {universeId}',
                      'Fallback name for a showcased experience when its name cannot be loaded',
                      translationKey(
                        'Label.ShowcasedExperienceUniverseWithId',
                        TranslationNamespace.AgreementsManager,
                      ),
                      { universeId: universeId.toString() },
                    );
                  const nameLink =
                    details?.rootPlaceId != null
                      ? EXTERNAL_EXPERIENCE_HREF(details.rootPlaceId)
                      : undefined;
                  const selectAriaLabel = tPendingTranslation(
                    'Select {experienceName}',
                    'ARIA label for selecting an experience to showcase on an IP listing',
                    translationKey(
                      'Label.SelectShowcasedExperience',
                      TranslationNamespace.AgreementsManager,
                    ),
                    { experienceName: name },
                  );
                  return (
                    <div
                      key={universeId}
                      ref={(tile) => {
                        if (tile) {
                          tileRefs.current.set(universeId, tile);
                        } else {
                          tileRefs.current.delete(universeId);
                        }
                      }}
                      className='group relative width-[144px]'
                      data-testid={
                        isConfirmedRejected
                          ? `rejected-showcase-content-${universeId.toString()}`
                          : undefined
                      }>
                      <button
                        type='button'
                        aria-label={selectAriaLabel}
                        aria-pressed={isSelected}
                        data-testid={`showcase-content-selection-${universeId.toString()}`}
                        className={cx(
                          classes.selectableTile,
                          isSelected && classes.selectedTile,
                          isConfirmedRejected && classes.rejectedTile,
                          isConfirmedRejected && 'stroke-system-alert',
                          'absolute inset-[0] block width-full cursor-pointer radius-medium [border:none] [background:transparent] [transition:box-shadow_0.2s] focus-visible:outline-focus',
                        )}
                        onClick={() => toggleSelection(universeId)}
                      />
                      <ShowcaseContentTile
                        universeId={universeId}
                        name={name}
                        nameLink={nameLink}
                        onNameClick={() =>
                          logEvent(
                            LicenseManagerClickEvent.IphListingsDetailsPageShowcaseContentClickEvent,
                            {
                              listingId,
                              contentType: 'Universe',
                              contentId: universeId,
                              contentPosition: index + 1,
                              surface: 'dialog',
                            },
                          )
                        }
                        className='relative padding-small [pointer-events:none] [&_a]:[pointer-events:auto]'
                      />
                      <div
                        className={cx(
                          'absolute [top:8px] [right:8px] [z-index:2] inline-flex items-center justify-center size-600 radius-small',
                          !isSelected && '[background-color:var(--color-shift-500)]',
                          !isSelected && classes.unselectedCheckbox,
                        )}>
                        <Checkbox
                          size='Medium'
                          placement='End'
                          aria-label={selectAriaLabel}
                          isChecked={isSelected}
                          onCheckedChange={() => toggleSelection(universeId)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className={`${CONTENT_VIEWPORT_CLASS} ${
                  replaceShowcaseContent.isError ? '!min-height-0' : ''
                } flex radius-medium stroke-standard stroke-default flex-col items-center justify-center padding-y-xxlarge padding-x-large`}>
                <ThemedImage
                  lightSrc={experiencesLight}
                  darkSrc={experiencesDark}
                  alt={illustrationAlt}
                />
                <div className='flex flex-col items-center gap-xsmall text-align-x-center max-width-[510px]'>
                  <h2 className='text-heading-medium content-emphasis margin-none'>
                    {emptyStateTitle}
                  </h2>
                  <p className='text-body-medium content-muted margin-none'>
                    {emptyStateDescription}
                  </p>
                </div>
              </div>
            )}
          </DialogBody>
          <DialogFooter
            className={`${classes.dialogFooter} flex flex-col gap-small`}
            data-testid='showcase-dialog-footer'>
            <div className='width-full'>
              {replaceShowcaseContent.isError || saveErrorKind !== null ? (
                <div className={classes.saveError} data-testid='showcase-save-error'>
                  <Alert variant='Feedback' severity='Error' hasCloseAffordance={false}>
                    {displayedSaveErrorMessage}
                  </Alert>
                </div>
              ) : null}
              <div className='flex gap-small justify-end width-full'>
                <Button
                  variant='Emphasis'
                  size='Medium'
                  onClick={handleSave}
                  isDisabled={isAddDisabled}>
                  {addLabel}
                </Button>
                <Button variant='Standard' size='Medium' onClick={handleCancel}>
                  {cancelLabel}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default withTranslation(ShowcasedExperiencesDialog, [
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);
