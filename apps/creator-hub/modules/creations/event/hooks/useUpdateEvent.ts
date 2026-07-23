import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { tryParseResponseError, virtualEventsClient } from '@modules/clients';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { FormState } from 'react-hook-form';
import {
  EventVisibility,
  FeaturingStatus,
  VirtualEventsUpdateVirtualEventRequest,
} from '@rbx/clients/virtualEventsApi';
import { CreateEventFormType } from '../components/CreateEventForm/types';
import { toRankedThumbnails } from '../utils/eventUtils';
import useMakeThumbnailsPublic from './useMakeThumbnailsPublic';

const useUpdateEvent = () => {
  const { error } = useMetricsMonitoring();
  const { translate } = useTranslation();
  const makeThumbnailsPublic = useMakeThumbnailsPublic();

  return useCallback(
    async (
      data: CreateEventFormType,
      formState: FormState<CreateEventFormType>,
      setErrorMsg: (error: string) => void,
    ) => {
      if (!data.id) {
        return { didPublishFail: false };
      }
      const rankedThumbnails = toRankedThumbnails(data.thumbnails);
      const { dirtyFields } = formState;
      const defaultErrorMessage = translate('Error.FailedToUpdateEvent');
      const parsedFeaturingStatus = data.featuringOptInStatus
        ? FeaturingStatus.Enabled
        : FeaturingStatus.Disabled;

      if (
        (dirtyFields.visibility || dirtyFields.thumbnails) &&
        data.visibility === EventVisibility.Public &&
        data.thumbnails.length > 0
      ) {
        try {
          // We await here so the event can only be made public if the thumbnails
          // are successfully made public first
          await makeThumbnailsPublic(rankedThumbnails);
        } catch (e) {
          const message = e instanceof Error ? e.message : defaultErrorMessage;
          setErrorMsg(message);
          error(message);
          return { newId: data.id, didPublishFail: false, didSaveFail: true };
        }
      }

      const request: VirtualEventsUpdateVirtualEventRequest = {
        title: dirtyFields.title ? data.title : undefined,
        subtitle: dirtyFields.subtitle ? data.subtitle : undefined,
        description: dirtyFields.description ? data.description : undefined,
        eventTime:
          dirtyFields.startTime || dirtyFields.endTime
            ? {
                startTime: data.startTime.toISOString(),
                endTime: data.endTime.toISOString(),
              }
            : undefined,
        // Note: until the isUpdated logic is replaced with exception logic we must include the
        // thumbnails even if they are not dirty
        thumbnails: rankedThumbnails,
        placeId: dirtyFields.placeId ? data.placeId : undefined,
        // Note: until the isUpdated logic is replaced with exception logic we must include the
        // event types even if they are not dirty
        eventCategories:
          data.primaryEventType === '' ? undefined : [{ category: data.primaryEventType, rank: 0 }],
        visibility: dirtyFields.visibility ? data.visibility : undefined,
        featuringStatus: dirtyFields.featuringOptInStatus ? parsedFeaturingStatus : undefined,
        tagline: dirtyFields.tagline ? data.tagline : undefined,
      };

      try {
        const { isUpdated, categoriesUpdated } = await virtualEventsClient.updateEvent(
          data.id,
          request,
        );

        if (!isUpdated || !categoriesUpdated) {
          setErrorMsg(defaultErrorMessage);
          return { newId: data.id, didPublishFail: false, didSaveFail: true };
        }
      } catch (e) {
        const parsedError = await tryParseResponseError(e);
        const message = parsedError?.message ?? defaultErrorMessage;
        setErrorMsg(message);
        error(message);

        return { newId: data.id, didPublishFail: false, didSaveFail: true };
      }

      return { newId: data.id };
    },
    [translate, makeThumbnailsPublic, error],
  );
};

export default useUpdateEvent;
