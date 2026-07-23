import React, {
  FunctionComponent,
  useCallback,
  useState,
  useEffect,
  useMemo,
  Fragment,
} from 'react';
import { useRouteChange } from '@modules/miscellaneous/hooks';
import { useForm, SubmitHandler, useFieldArray, FormState } from 'react-hook-form';
import Router, { useRouter } from 'next/router';
import {
  FormHelperText,
  Grid,
  useSnackbar,
  Typography,
  DialogTemplate,
  useDialog,
  useMediaQuery,
  Link,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { VirtualEventDetails } from '@modules/clients';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import {
  EventMedia,
  EventStatus,
  EventVisibility,
  FeaturingStatus,
  VirtualEventResponse,
} from '@rbx/clients/virtualEventsApi';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useSettings } from '@modules/settings';
import {
  getEventDetailsUrl,
  getEventTabFromTiming,
  maybeAppendGroupIdToUrl,
  statusToVisibility,
} from '../../utils/eventUtils';
import useConfigureEventFormStyles from './ConfigureEventFormV2.styles';
import { CreateEventFormDefaultValues, CreateEventFormType, EventThumbnail } from './types';
import ConfigureEventButtonGroup from './ConfigureEventButtonGroup';
import sendEventsAnalyticsEvent from '../../utils/eventsAnalyticsHelper';
import EventTimeSelectorGroup from './inputs/EventTimeSelectorGroup';
import EventPlaceSelect from './inputs/EventPlaceSelect';
import EventPrivacySelector from './inputs/EventPrivacySelector';
import EventTitleField from './inputs/EventTitleField';
import EventDescriptionField from './inputs/EventDescriptionField';
import EventSubtitleField from './inputs/EventSubtitleField';
import EventThumbnailUploaderM3 from './inputs/EventThumbnailUploaderM3';
import EventCategorySelector from './inputs/EventCategorySelector';
import EventFeaturingFields from './inputs/EventFeaturingFields';

export type ConfigureEventFormProps = {
  universeId: number;
  initialEventDetails?: VirtualEventDetails;
  onSaveOrPublish: (
    data: CreateEventFormType,
    formState: FormState<CreateEventFormType>,
    setErrorMsg: (error: string) => void,
  ) => Promise<{ newId?: string; didSaveFail?: boolean }>;
  correlationId?: string;
};

function parseThumbnailData(medias: EventMedia[]): EventThumbnail[] {
  const thumbnails: EventThumbnail[] = [];
  medias.forEach((media) => {
    if (media.rank !== null && media.rank !== undefined && media.mediaId) {
      thumbnails[media.rank] = { id: media.mediaId, url: undefined };
    }
  });
  return thumbnails;
}

function mergeFormValues(
  defaultValues: CreateEventFormType,
  initialEventDetails: VirtualEventResponse | undefined,
  correlationId: string | undefined,
  rootPlaceId: number,
): CreateEventFormType {
  if (!initialEventDetails || !initialEventDetails.id) {
    return { ...defaultValues, correlationId, placeId: rootPlaceId };
  }

  const initialValues = { ...defaultValues, id: initialEventDetails.id, placeId: rootPlaceId };
  if (initialEventDetails.title) {
    initialValues.title = initialEventDetails.title;
  }
  if (initialEventDetails.subtitle) {
    initialValues.subtitle = initialEventDetails.subtitle;
  }
  if (initialEventDetails.description) {
    initialValues.description = initialEventDetails.description;
  }
  if (initialEventDetails.universeId) {
    initialValues.universeId = initialEventDetails.universeId;
  }
  if (initialEventDetails.placeId) {
    initialValues.placeId = initialEventDetails.placeId;
  }
  if (initialEventDetails.eventTime) {
    initialValues.startTime =
      initialEventDetails.eventTime.startUtc ?? CreateEventFormDefaultValues.startTime;
    initialValues.endTime =
      initialEventDetails.eventTime.endUtc ?? CreateEventFormDefaultValues.endTime;
  }
  if (initialEventDetails.eventCategories) {
    const primaryCategory = initialEventDetails.eventCategories.find(
      (category) => category.rank === 0,
    );
    const secondaryCategory = initialEventDetails.eventCategories.find(
      (category) => category.rank === 1,
    );

    if (primaryCategory) {
      initialValues.primaryEventType = primaryCategory.category || '';
    }
    if (secondaryCategory) {
      initialValues.secondaryEventType = secondaryCategory.category || '';
    }
  }
  if (initialEventDetails.thumbnails) {
    initialValues.thumbnails = parseThumbnailData(initialEventDetails.thumbnails);
  }
  if (initialEventDetails.eventStatus) {
    // TODO: (rachel.anderson, ARKS-1441): Add check directly to visibility when available
    initialValues.visibility = statusToVisibility(initialEventDetails.eventStatus);
  }
  if (initialEventDetails.featuringStatus) {
    initialValues.featuringOptInStatus =
      initialEventDetails.featuringStatus === FeaturingStatus.Enabled;
  }
  if (initialEventDetails.tagline) {
    initialValues.tagline = initialEventDetails.tagline;
  }
  return initialValues;
}

// TODO (rachel.anderson, ARKS-879): Break ConfigureEventFormV2 down into smaller components for readability and reusability

const ConfigureEventFormV2: FunctionComponent<React.PropsWithChildren<ConfigureEventFormProps>> = ({
  universeId,
  initialEventDetails,
  onSaveOrPublish,
  correlationId,
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const {
    classes: { errorMessageStyles, inputsContainer },
  } = useConfigureEventFormStyles();
  const router = useRouter();
  const { translate, translateHTML } = useTranslation();
  const { enqueue: enqueueToast } = useSnackbar();
  const currentGroup = useCurrentGroup();
  const { open, close: closeDialog, configure } = useDialog();
  const { gameDetails } = useCurrentGame();

  const { control, setValue, formState, getValues, trigger } = useForm<CreateEventFormType>({
    mode: FormMode.OnTouched,
    reValidateMode: FormMode.OnChange,
    defaultValues: mergeFormValues(
      CreateEventFormDefaultValues,
      initialEventDetails,
      correlationId,
      gameDetails?.rootPlaceId as number,
    ),
  });

  const { replace } = useFieldArray({
    control,
    name: 'thumbnails',
  });
  useEffect(() => {
    if (initialEventDetails?.thumbnails) {
      replace(parseThumbnailData(initialEventDetails?.thumbnails));
    }
    setValue('id', initialEventDetails?.id || undefined);
  }, [initialEventDetails?.id, initialEventDetails?.thumbnails, replace, setValue]);
  // isDirty: true if the form has been changed from its default or last published state
  const { isDirty } = formState;
  const [eventCreationErrorMsg, setEventCreationErrorMsg] = useState<string>('');
  const [didConfirmDiscardChanges, setDidConfirmDiscardChanges] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [didSaveOrPublish, setDidSaveOrPublish] = useState<boolean>(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState<boolean>(false);
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const isPublished = useMemo(
    () => initialEventDetails?.eventStatus === EventStatus.Active,
    [initialEventDetails?.eventStatus],
  );

  const isRunning = useMemo(
    () =>
      isPublished &&
      initialEventDetails?.eventTime?.startUtc &&
      initialEventDetails?.eventTime?.startUtc.getTime() <= new Date().getTime(),
    [initialEventDetails?.eventTime?.startUtc, isPublished],
  );

  const { isFetched, settings } = useSettings();

  useEffect(() => {
    if (universeId) {
      setValue('universeId', universeId);
    }
  }, [universeId, setValue]);

  useEffect(() => {
    if (initialEventDetails) {
      trigger();
    }
  }, [initialEventDetails, trigger]);

  /*
   * Save and publish logic
   */

  const handleFormSubmit: SubmitHandler<CreateEventFormType> = useCallback(
    async (data) => {
      setDidSaveOrPublish(true);
      setEventCreationErrorMsg('');
      setIsSubmitting(true);
      closeDialog();

      // Save event
      const { newId, didSaveFail } = await onSaveOrPublish(
        data,
        formState,
        setEventCreationErrorMsg,
      );
      setIsSubmitting(false);

      // Handle routing
      const targetTab = getEventTabFromTiming(getValues().startTime, getValues().endTime);
      if (newId && !didSaveFail) {
        // Log event creation (TODO, ARKS-1924: update funnel steps, drafts don't exist anymore)
        if (!isPublished) {
          sendEventsAnalyticsEvent(trackerClient, {
            eventType: CreatorDashboardEventType.EventCreationSaveDraft,
            newEventCorrelationId: data.correlationId,
            virtualEventId: newId,
            universeId: data.universeId?.toString(),
          });
        }

        enqueueToast(
          {
            message: translate('Message.EventCreationSuccess'),
            autoHide: true,
          },
          (reason) => reason === 'timeout',
        );

        // If the event is newly public we open the roblox.com page in a new tab
        if (
          formState.dirtyFields.visibility &&
          getValues('visibility') === EventVisibility.Public
        ) {
          // Log event publish (TODO: update funnel steps, this was previously at most once and strictly greater than drafts)
          sendEventsAnalyticsEvent(trackerClient, {
            eventType: CreatorDashboardEventType.EventCreationPublish,
            newEventCorrelationId: data.correlationId,
            virtualEventId: newId,
            universeId: data.universeId?.toString(),
          });

          const detailsUrl = getEventDetailsUrl(newId);
          if (detailsUrl) {
            window.open(detailsUrl, '_blank');
          }
        }
        // Send the user back to the event page for the experience
        const eventPagePath = maybeAppendGroupIdToUrl(
          `/dashboard/creations/experiences/${router.query.id}/events?activeTab=${targetTab.name}`,
          currentGroup,
        );
        Router.push(eventPagePath);
      }
    },
    [
      closeDialog,
      onSaveOrPublish,
      formState,
      getValues,
      isPublished,
      enqueueToast,
      translate,
      router.query.id,
      currentGroup,
      trackerClient,
    ],
  );

  /*
   * Confirmation Dialogs
   */

  const ConfirmPrivateDialog = useMemo(
    () => (
      <DialogTemplate
        onCancel={closeDialog}
        onConfirm={() => handleFormSubmit(getValues())}
        title={translate('Heading.EEMakeEventPrivate')}
        content={translate('Description.EEPrivateEventConfirmation')}
        confirmText={translate('Action.Confirm')}
        cancelText={translate('Action.Cancel')}
      />
    ),
    [closeDialog, getValues, handleFormSubmit, translate],
  );

  const handleConfirmDiscardChanges = useCallback(() => {
    setDidConfirmDiscardChanges(true);
    closeDialog();
    Router.push(`/dashboard/creations/experiences/${router.query.id}/events`);
  }, [closeDialog, router.query.id]);

  const ConfirmDiscardDialog = useMemo(
    () => (
      <DialogTemplate
        onCancel={closeDialog}
        onConfirm={handleConfirmDiscardChanges}
        title={translate('Heading.ConfirmDiscardChanges')}
        content={translate('Message.ConfirmDiscardChanges')}
        confirmText={translate('Action.Discard')}
        cancelText={translate('Action.Cancel')}
      />
    ),
    [closeDialog, handleConfirmDiscardChanges, translate],
  );

  const handlePublishButtonClick = useCallback(() => {
    // If the user is changing their event to private, we open a confirmation dialog,
    // otherwise we just go ahead and save their changes.
    if (
      formState.dirtyFields.visibility &&
      getValues('visibility').toString() === EventVisibility.Private.toString()
    ) {
      configure(ConfirmPrivateDialog);
      open();
    } else {
      setValue('id', initialEventDetails?.id ?? undefined);
      handleFormSubmit(getValues());
    }
  }, [
    formState.dirtyFields.visibility,
    getValues,
    configure,
    ConfirmPrivateDialog,
    open,
    setValue,
    initialEventDetails?.id,
    handleFormSubmit,
  ]);

  /*
   * Prompt save/discard when user attempts to leave page
   */

  const handleRouteChangeStart = useCallback(
    (stopRouteChange: () => never) => (url: string) => {
      // Try to stop the user from navigating away with unsaved changes (so inapplicable
      // if the pathname isn't a navigation or we did save/publish)
      if (Router.pathname === url || didSaveOrPublish) {
        return;
      }

      // Check if we're actually going to be navigating away so that we can fire
      // the correct analytics event
      if (!isDirty || didConfirmDiscardChanges) {
        if (!didSaveOrPublish && !initialEventDetails?.id) {
          sendEventsAnalyticsEvent(trackerClient, {
            eventType: CreatorDashboardEventType.EventCreationDiscarded,
            newEventCorrelationId: correlationId,
          });
        }

        return;
      }

      // If we've gotten this far, there is at least one unsaved change that
      // the user has not agreed to discard, so warn them and block the navigation
      configure(ConfirmDiscardDialog);
      open();
      stopRouteChange();
    },
    [
      ConfirmDiscardDialog,
      configure,
      correlationId,
      didConfirmDiscardChanges,
      didSaveOrPublish,
      initialEventDetails?.id,
      isDirty,
      open,
      trackerClient,
    ],
  );
  useRouteChange(handleRouteChangeStart);
  useEffect(() => {
    const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      if (isDirty && !didConfirmDiscardChanges && !didSaveOrPublish) {
        e.preventDefault();
        return 'Unsaved changes';
      }
      return '';
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);

    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [
    correlationId,
    didSaveOrPublish,
    initialEventDetails?.id,
    isDirty,
    didConfirmDiscardChanges,
    trackerClient,
    handleRouteChangeStart,
  ]);

  /*
   * Event Form
   */

  // TODO:
  // - (rachel.anderson ARKS-875) Localize error messages

  return (
    <Grid container direction='column'>
      {!isCompactView && (
        <Fragment>
          <Typography variant='h1'>
            {initialEventDetails?.id
              ? translate('Heading.EEEditEventOrUpdate')
              : translate('Heading.EECreateEventOrUpdate')}
          </Typography>
          <Typography>
            {/* This code formatting is a little wonky because we're concatenating an old banner header
            and body, which also contains a Link subcomponent. */}
            {`${translate('Message.OldUpdatesPageBanner')} `}
            {translateHTML('Message.AccessOldUpdatesPage', [
              {
                opening: 'updatesLinkStart',
                closing: 'updatesLinkEnd',
                content(chunks) {
                  return (
                    <Link
                      href={`/dashboard/creations/experiences/${universeId}/updates`}
                      target='_blank'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        </Fragment>
      )}
      <Grid className={inputsContainer} marginTop='32px'>
        <Grid container direction='column' gap='16px'>
          <EventThumbnailUploaderM3
            getValues={getValues}
            replace={replace}
            isUploadingThumbnail={isUploadingThumbnail}
            setIsUploadingThumbnail={setIsUploadingThumbnail}
          />
        </Grid>
        <EventCategorySelector formState={formState} control={control} />
        <Grid className={inputsContainer} gap='sm'>
          <EventTitleField formState={formState} control={control} useM3Validation />
          <EventSubtitleField formState={formState} control={control} />
          <EventDescriptionField control={control} formState={formState} getValues={getValues} />
        </Grid>
        <EventTimeSelectorGroup
          formState={formState}
          control={control}
          isRunning={isRunning}
          getValues={getValues}
          trigger={trigger}
        />
        <Fragment>
          {isFetched && settings.enablePlaceSelectForEvent && (
            <EventPlaceSelect control={control} getValues={getValues} setValue={setValue} />
          )}
          <EventPrivacySelector control={control} />
        </Fragment>
        <EventFeaturingFields
          formState={formState}
          initialStartTime={initialEventDetails?.eventTime?.startUtc}
          control={control}
          getValues={getValues}
          setValue={setValue}
          trigger={trigger}
        />
      </Grid>
      <ConfigureEventButtonGroup
        handlePublishButtonClick={handlePublishButtonClick}
        formState={formState}
        initialEventDetails={initialEventDetails}
        isSubmitting={isSubmitting}
        isUploadingThumbnail={isUploadingThumbnail}
      />
      {eventCreationErrorMsg && (
        <FormHelperText className={errorMessageStyles} error>
          {eventCreationErrorMsg}
        </FormHelperText>
      )}
    </Grid>
  );
};

export default ConfigureEventFormV2;
