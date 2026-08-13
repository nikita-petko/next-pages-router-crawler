import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ShowcaseContentReferenceRequest } from '@rbx/client-content-licensing-api/v1';
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
  Icon,
  Tooltip,
  TooltipTrigger,
  VisuallyHidden,
} from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { CircularProgress, makeStyles } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { getResponseFromError } from '@modules/clients/utils';
import ThemedImage from '@modules/miscellaneous/components/ThemedImage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ShowcaseContentTile from '../../components/ShowcaseContentTile';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
} from '../../utils/logger';
import useGetShowcaseUniverseDetails from '../hooks/useGetShowcaseUniverseDetails';
import useListShowcaseEligibleContentByListing from '../hooks/useListShowcaseEligibleContentByListing';
import useReplaceListingShowcaseContentMutation from '../hooks/useReplaceListingShowcaseContentMutation';

type ShowcasedExperiencesDialogProps = {
  open: boolean;
  listingId: string;
  selectedContent?: ShowcaseContentReferenceRequest[];
  ifMatch?: string;
  onClose: () => void;
};

const EMPTY_SELECTED_CONTENT: ShowcaseContentReferenceRequest[] = [];
// A tile row is 168px tall. The maximum shows two full rows, two 16px gaps,
// and half of a third row to communicate that the viewport is scrollable.
const CONTENT_VIEWPORT_CLASS = 'width-full min-height-[168px] max-height-[452px]';
const MAX_SHOWCASE_SELECTIONS = 10;
const MAX_FULLY_VISIBLE_TILE_COUNT = 10;
const SHOWCASE_ELIGIBLE_CONTENT_PAGE_SIZE = 500;

const getUniverseIds = (
  content: Array<{ contentType?: string; contentId?: string | null }> | null | undefined,
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
  invalidSelectedTile: {
    boxShadow: `inset 0 0 0 2px ${theme.palette.actionV2.important.fill}`,
    '&:hover': {
      boxShadow: `inset 0 0 0 2px ${theme.palette.actionV2.important.fill}`,
    },
  },
  ineligibleOverlay: {
    backgroundColor: theme.palette.components.media.overlay,
    color: theme.palette.common.white,
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
  const [selectedUniverseIds, setSelectedUniverseIds] = useState(selectedContentUniverseIds);
  const invalidUniverseIds = useMemo(() => {
    if (!showcaseEligibleContentReq.isSuccess) {
      return new Set<number>();
    }
    const eligibleUniverseIdSet = new Set(eligibleUniverseIds);
    return new Set(
      selectedContentUniverseIds.filter((universeId) => !eligibleUniverseIdSet.has(universeId)),
    );
  }, [eligibleUniverseIds, selectedContentUniverseIds, showcaseEligibleContentReq.isSuccess]);
  const selectableUniverseIds = useMemo(
    () => [...new Set([...selectedContentUniverseIds, ...eligibleUniverseIds])],
    [eligibleUniverseIds, selectedContentUniverseIds],
  );
  const hasSelectedInvalidUniverse = selectedUniverseIds.some((universeId) =>
    invalidUniverseIds.has(universeId),
  );
  const dialogLayoutRef = useRef<HTMLDivElement>(null);
  const submittedUniverseIdsRef = useRef<number[]>([]);
  const hasLoggedScrollableContentImpressionRef = useRef(false);
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
        },
      );
      dialogLayoutRef.current?.style.removeProperty('height');
      onClose();
    },
    onError: (error) => {
      const submittedUniverseIds = submittedUniverseIdsRef.current;
      logEvent(
        LicenseManagerImpressionEvent.IphListingsDetailsPageSaveShowcasedExperiencesFailureImpressionEvent,
        {
          listingId,
          selectedCount: submittedUniverseIds.length,
          universeIds: submittedUniverseIds.join(','),
          failureStatus: getResponseFromError(error)?.status ?? 'unknown',
        },
      );
    },
    onConflict: (latestContent) => {
      if (latestContent) {
        setSelectedUniverseIds(getUniverseIds(latestContent.content));
      }
    },
  });
  const toggleSelection = useCallback(
    (universeId: number) => {
      const isSelected = selectedUniverseIds.includes(universeId);
      if (!isSelected && invalidUniverseIds.has(universeId)) {
        return;
      }
      if (!isSelected && selectedUniverseIds.length >= MAX_SHOWCASE_SELECTIONS) {
        return;
      }

      replaceShowcaseContent.reset();
      const nextSelectedUniverseIds = isSelected
        ? selectedUniverseIds.filter((selectedUniverseId) => selectedUniverseId !== universeId)
        : [...selectedUniverseIds, universeId];
      setSelectedUniverseIds(nextSelectedUniverseIds);
      logEvent(LicenseManagerClickEvent.IphListingsDetailsPageToggleShowcasedExperienceClickEvent, {
        listingId,
        contentType: 'Universe',
        contentId: universeId,
        action: isSelected ? 'deselect' : 'select',
        selectedCount: nextSelectedUniverseIds.length,
      });
    },
    [invalidUniverseIds, listingId, logEvent, replaceShowcaseContent, selectedUniverseIds],
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
      hasSelectedInvalidUniverse
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
    'Manage featured creations',
    'Title of the dialog for adding spotlighted creations to an IP listing',
    translationKey('Heading.AddSpotlightedCreations', TranslationNamespace.AgreementsManager),
  );
  const invalidSelectionDescription = tPendingTranslation(
    'One or more of your featured creations is no longer in active license agreement. Please deselect them.',
    'Warning shown when a spotlighted creation is no longer eligible',
    translationKey(
      'Description.IneligibleSpotlightedCreations',
      TranslationNamespace.AgreementsManager,
    ),
  );
  const ineligibleCreationLabel = tPendingTranslation(
    'Ineligible creation',
    'Label shown over a spotlighted creation that can no longer be selected',
    translationKey('Label.IneligibleCreation', TranslationNamespace.AgreementsManager),
  );
  const ineligibleCreationTooltip = tPendingTranslation(
    'This creation is no longer in active license agreement with this listing',
    'Tooltip explaining why a spotlighted creation can no longer be selected',
    translationKey(
      'Description.IneligibleSpotlightedCreationTooltip',
      TranslationNamespace.AgreementsManager,
    ),
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
  const hasRemovedSelections = selectedContentUniverseIds.some(
    (universeId) => !selectedUniverseIds.includes(universeId),
  );
  const isAddDisabled =
    isContentError ||
    showcaseEligibleContentReq.isPending ||
    showcaseEligibleContentReq.isFetching ||
    hasSelectedInvalidUniverse ||
    replaceShowcaseContent.isPending ||
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
  useEffect(() => {
    if (open && hasSelectedInvalidUniverse) {
      logEvent(
        LicenseManagerImpressionEvent.IphListingsDetailsPageInvalidShowcasedExperiencesWarningImpressionEvent,
        {
          listingId,
          surface: 'dialog',
          invalidSelectionCount: invalidUniverseIds.size,
          universeIds: [...invalidUniverseIds].join(','),
        },
      );
    }
  }, [hasSelectedInvalidUniverse, invalidUniverseIds, listingId, logEvent, open]);

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
                className={cx(
                  classes.tileViewport,
                  CONTENT_VIEWPORT_CLASS,
                  replaceShowcaseContent.isError && '!min-height-0',
                  'grid [grid-template-columns:repeat(auto-fill,144px)] [align-content:flex-start] [justify-content:space-between] [overflow-y:auto] gap-y-medium',
                )}
                data-testid='showcase-content-selection-grid'>
                {selectableUniverseIds.map((universeId) => {
                  const isSelected = selectedUniverseIds.includes(universeId);
                  const isInvalid = invalidUniverseIds.has(universeId);
                  const isDeselectedInvalid = isInvalid && !isSelected;
                  const ineligibleDescriptionId = `ineligible-showcase-content-description-${universeId.toString()}`;
                  const name =
                    detailsByUniverseId.get(universeId)?.name ??
                    tPendingTranslation(
                      'Universe {universeId}',
                      'Fallback name for a showcased experience when its name cannot be loaded',
                      translationKey(
                        'Label.ShowcasedExperienceUniverseWithId',
                        TranslationNamespace.AgreementsManager,
                      ),
                      { universeId: universeId.toString() },
                    );
                  const selectAriaLabel = tPendingTranslation(
                    'Select {experienceName}',
                    'ARIA label for selecting an experience to showcase on an IP listing',
                    translationKey(
                      'Label.SelectShowcasedExperience',
                      TranslationNamespace.AgreementsManager,
                    ),
                    { experienceName: name },
                  );
                  if (isDeselectedInvalid) {
                    const ineligibleCreationAriaLabel = tPendingTranslation(
                      '{experienceName}: {label}',
                      'ARIA label for a spotlighted creation that can no longer be selected',
                      translationKey(
                        'Label.IneligibleSpotlightedCreationAriaLabel',
                        TranslationNamespace.AgreementsManager,
                      ),
                      { experienceName: name, label: ineligibleCreationLabel },
                    );
                    return (
                      <div key={universeId} className='group relative width-[144px]'>
                        <Tooltip position='top-center' title={ineligibleCreationTooltip}>
                          <TooltipTrigger asChild>
                            <button
                              type='button'
                              className='relative block width-full radius-medium clip padding-small [border:none] [background:transparent] text-align-x-left cursor-not-allowed focus-visible:outline-focus'
                              aria-disabled='true'
                              aria-label={ineligibleCreationAriaLabel}
                              aria-describedby={ineligibleDescriptionId}
                              data-testid={`ineligible-showcase-content-${universeId}`}>
                              <ShowcaseContentTile universeId={universeId} name={name} />
                              <VisuallyHidden id={ineligibleDescriptionId}>
                                {ineligibleCreationTooltip}
                              </VisuallyHidden>
                              <div
                                className={`${classes.ineligibleOverlay} absolute inset-[0] [z-index:2] flex flex-col items-center justify-center gap-xsmall padding-small text-align-x-center`}>
                                <Icon name='icon-regular-triangle-exclamation' size='Medium' />
                                <span className='text-label-medium'>{ineligibleCreationLabel}</span>
                              </div>
                            </button>
                          </TooltipTrigger>
                        </Tooltip>
                      </div>
                    );
                  }
                  return (
                    <div key={universeId} className='group relative width-[144px]'>
                      <button
                        type='button'
                        aria-pressed={isSelected}
                        data-testid={`showcase-content-selection-${universeId.toString()}`}
                        className={cx(
                          classes.selectableTile,
                          isSelected && classes.selectedTile,
                          isInvalid && classes.invalidSelectedTile,
                          isInvalid && 'stroke-system-alert',
                          'block width-full cursor-pointer radius-medium padding-small [border:none] [background:transparent] [transition:box-shadow_0.2s] text-align-x-left focus-visible:outline-focus',
                        )}
                        onClick={() => toggleSelection(universeId)}>
                        <ShowcaseContentTile universeId={universeId} name={name} />
                      </button>
                      <div
                        className={cx(
                          'absolute [top:8px] [right:8px] inline-flex items-center justify-center size-600 radius-small',
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
            {hasSelectedInvalidUniverse ? (
              <div className='width-full'>
                <p
                  className='text-body-medium content-system-alert margin-none width-full'
                  role='alert'>
                  {invalidSelectionDescription}
                </p>
              </div>
            ) : null}
            <div className='width-full'>
              {replaceShowcaseContent.isError ? (
                <div className={classes.saveError} data-testid='showcase-save-error'>
                  <Alert variant='Feedback' severity='Error' hasCloseAffordance={false}>
                    {saveErrorMessage}
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
