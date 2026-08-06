import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { CircularProgress, makeStyles } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
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
const CONTENT_VIEWPORT_CLASS = 'width-full height-[600px] min-height-[600px]';
const MAX_SHOWCASE_SELECTIONS = 10;
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
  unselectedCheckbox: {
    boxShadow: `inset 0 0 0 2px ${theme.palette.common.white}`,
    '& [data-slot="checkbox"]': {
      opacity: 0,
    },
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
  const eligibleUniverseIds = useMemo(
    () => [...new Set(getUniverseIds(showcaseEligibleContentReq.data?.content))],
    [showcaseEligibleContentReq.data?.content],
  );
  const selectedContentUniverseIds = useMemo(
    () => getUniverseIds(selectedContent),
    [selectedContent],
  );
  const [selectedUniverseIds, setSelectedUniverseIds] = useState(selectedContentUniverseIds);
  const selectableUniverseIds = useMemo(
    () => [...new Set([...eligibleUniverseIds, ...selectedUniverseIds])],
    [eligibleUniverseIds, selectedUniverseIds],
  );
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
    onSuccess: onClose,
    onConflict: (latestContent) => {
      if (latestContent) {
        setSelectedUniverseIds(getUniverseIds(latestContent.content));
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
      setSelectedUniverseIds(nextSelectedUniverseIds);
      logEvent(LicenseManagerClickEvent.IphListingsDetailsPageToggleShowcasedExperienceClickEvent, {
        listingId,
        contentType: 'Universe',
        contentId: universeId,
        action: isSelected ? 'deselect' : 'select',
        selectedCount: nextSelectedUniverseIds.length,
      });
    },
    [listingId, logEvent, selectedUniverseIds],
  );

  const closeDialog = (action: 'cancel' | 'dismiss') => {
    logEvent(LicenseManagerClickEvent.IphListingsDetailsPageCloseShowcasedExperiencesClickEvent, {
      listingId,
      action,
      selectedCount: selectedUniverseIds.length,
    });
    onClose();
  };

  const handleCancel = () => {
    closeDialog('cancel');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      closeDialog('dismiss');
    }
  };

  const handleSave = () => {
    logEvent(LicenseManagerClickEvent.IphListingsDetailsPageSaveShowcasedExperiencesClickEvent, {
      listingId,
      selectedCount: selectedUniverseIds.length,
    });
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
    'Select showcased experiences',
    'Title of the dialog for selecting experiences to showcase on an IP listing',
    translationKey('Heading.SelectShowcasedExperiences', TranslationNamespace.AgreementsManager),
  );
  const description = tPendingTranslation(
    'Select up to 10 games to feature on this license listing. These will be highlighted to Creators browsing your IP.',
    'Description explaining how to select experiences for an IP listing showcase',
    translationKey('Description.ShowcasedExperiences', TranslationNamespace.AgreementsManager),
  );
  const emptyStateTitle = tPendingTranslation(
    'No licensed experiences yet',
    'Empty-state heading when an IP listing has no experiences with active license agreements',
    translationKey('Heading.NoLicensedExperiencesYet', TranslationNamespace.AgreementsManager),
  );
  const emptyStateDescription = tPendingTranslation(
    'No experiences are in active agreement with the licenses for this listing yet.',
    'Empty-state description when an IP listing has no experiences with active license agreements',
    translationKey('Description.NoLicensedExperiencesYet', TranslationNamespace.AgreementsManager),
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
  const saveLabel = tPendingTranslation(
    'Save selections',
    'Action to save selected experiences for an IP listing showcase',
    translationKey('Action.SaveSelections', TranslationNamespace.AgreementsManager),
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
    translationKey('Heading.FailedToLoadPage', TranslationNamespace.Error),
  );
  const loadErrorDescription = translate(
    translationKey('Error.LoadingData', TranslationNamespace.AgreementsManager),
  );
  const loadErrorAction = translate(
    translationKey('Action.FailedToLoadPage', TranslationNamespace.Error),
  );

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

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      size='Large'
      isModal
      hasCloseAffordance={false}>
      <DialogContent className='flex flex-col min-width-0 width-[min(880px,95vw)] !max-width-[min(880px,95vw)]'>
        <DialogBody className='flex flex-col gap-medium'>
          <div className='flex flex-col gap-xsmall'>
            <DialogTitle className='text-heading-small content-emphasis margin-none'>
              {title}
            </DialogTitle>
            <p className='text-body-medium content-default margin-none'>{description}</p>
          </div>
          {isContentLoading ? (
            <div
              className={`${CONTENT_VIEWPORT_CLASS} flex radius-medium stroke-standard stroke-default items-center justify-center`}>
              <CircularProgress />
            </div>
          ) : showcaseEligibleContentReq.isError ? (
            <div
              className={`${CONTENT_VIEWPORT_CLASS} flex radius-medium stroke-standard stroke-default flex-col items-center justify-center padding-y-xxlarge padding-x-large`}>
              <ThemedImage lightSrc={loadErrorLight} darkSrc={loadErrorDark} alt='' />
              <div className='flex flex-col items-center gap-small text-align-x-center max-width-[510px]'>
                <h2 className='text-heading-small content-emphasis margin-none'>
                  {loadErrorTitle}
                </h2>
                <p className='text-body-medium content-muted margin-none'>{loadErrorDescription}</p>
                <Button variant='Standard' size='Medium' onClick={handleRetry}>
                  {loadErrorAction}
                </Button>
              </div>
            </div>
          ) : isContentError ? (
            <div
              className={`${CONTENT_VIEWPORT_CLASS} radius-medium stroke-standard stroke-default padding-medium`}>
              <Alert
                variant='Feedback'
                severity='Error'
                hasCloseAffordance={false}
                className='!width-fit !stroke-default [&>div[aria-hidden=true]]:!bg-shift-100'>
                <span className='inline-flex items-center gap-small'>
                  <span>
                    {translate(
                      translationKey('Error.LoadingData', TranslationNamespace.AgreementsManager),
                    )}
                  </span>
                  <Button
                    variant='Link'
                    size='Small'
                    className='![height:auto] !padding-none !text-label-medium [&>div]:!bg-none [&>div]:!transition-none [&>span>span]:!padding-none'
                    onClick={handleRetry}>
                    {retryLabel}
                  </Button>
                </span>
              </Alert>
            </div>
          ) : selectableUniverseIds.length > 0 ? (
            <div
              className={cx(
                classes.tileViewport,
                CONTENT_VIEWPORT_CLASS,
                'flex [flex-wrap:wrap] [align-content:flex-start] [overflow-y:auto] gap-medium',
              )}>
              {selectableUniverseIds.map((universeId) => {
                const isSelected = selectedUniverseIds.includes(universeId);
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
                return (
                  <div key={universeId} className='group relative width-[144px]'>
                    <button
                      type='button'
                      aria-pressed={isSelected}
                      className={cx(
                        classes.selectableTile,
                        isSelected && classes.selectedTile,
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
              className={`${CONTENT_VIEWPORT_CLASS} flex radius-medium stroke-standard stroke-default flex-col items-center justify-center padding-y-xxlarge padding-x-large`}>
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
          {replaceShowcaseContent.isError ? (
            <Alert variant='Feedback' severity='Error' hasCloseAffordance={false}>
              {saveErrorMessage}
            </Alert>
          ) : null}
        </DialogBody>
        <DialogFooter className='flex gap-small justify-end'>
          <Button variant='Standard' size='Medium' onClick={handleCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant='Emphasis'
            size='Medium'
            onClick={handleSave}
            isDisabled={isContentError || replaceShowcaseContent.isPending}>
            {saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default withTranslation(ShowcasedExperiencesDialog, [
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);
