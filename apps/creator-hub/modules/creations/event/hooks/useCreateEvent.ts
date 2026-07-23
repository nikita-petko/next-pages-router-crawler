import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { tryParseResponseError, virtualEventsClient } from '@modules/clients';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import {
  EventRankedCategory,
  EventVisibility,
  FeaturingStatus,
} from '@rbx/clients/virtualEventsApi';
import { FormState } from 'react-hook-form';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { CreatorType } from '@modules/miscellaneous/common';
import { CreateEventFormType } from '../components/CreateEventForm/types';
import { toRankedThumbnails } from '../utils/eventUtils';
import useMakeThumbnailsPublic from './useMakeThumbnailsPublic';

const useCreateEvent = () => {
  const { error } = useMetricsMonitoring();
  const { translate } = useTranslation();
  const makeThumbnailsPublic = useMakeThumbnailsPublic();
  const currentGame = useCurrentGame();

  return useCallback(
    async (
      data: CreateEventFormType,
      _: FormState<CreateEventFormType>, // For type compatibility with useUpdateEvent
      setErrorMsg: (error: string) => void,
    ) => {
      let newId: string | null | undefined;
      let newEventCategories: EventRankedCategory[] | null | undefined;
      const rankedThumbnails = toRankedThumbnails(data.thumbnails);
      const defaultErrorMessage = translate('Error.FailedToCreate');
      const creator = currentGame.gameDetails?.creator;

      if (data.visibility === EventVisibility.Public && data.thumbnails.length > 0) {
        try {
          // We await here so the event can only be made public if the thumbnails
          // are successfully made public first
          await makeThumbnailsPublic(rankedThumbnails);
        } catch (e) {
          const message = e instanceof Error ? e.message : defaultErrorMessage;
          setErrorMsg(message);
          error(message);
          return { didSaveFail: true };
        }
      }

      try {
        const { id, eventCategories } = await virtualEventsClient.createNewEvent(
          data.title,
          data.subtitle,
          data.description,
          data.startTime,
          data.endTime,
          rankedThumbnails,
          data.universeId as number,
          data.placeId as number,
          creator?.type === CreatorType.Group && creator?.id ? creator.id : null,
          data.primaryEventType,
          data.secondaryEventType,
          data.visibility,
          data.featuringOptInStatus ? FeaturingStatus.Enabled : FeaturingStatus.Disabled,
          data.featuringOptInStatus ? data.tagline : '',
        );

        newId = id;
        newEventCategories = eventCategories;
      } catch (e) {
        let errorString = translate('Error.FailedToCreate');
        const parsedError = await tryParseResponseError(e);

        if (parsedError !== null) {
          errorString = parsedError.message;
        }

        setErrorMsg(errorString);
        error(errorString);

        return { didSaveFail: true };
      }

      if (!newId) {
        // No ID => the creation failed
        setErrorMsg(translate('Error.FailedToCreate'));
      }

      if (
        (data.primaryEventType !== '' &&
          !newEventCategories?.some(
            (rankedCategory) =>
              rankedCategory.category === data.primaryEventType && rankedCategory.rank === 0,
          )) ||
        (data.secondaryEventType !== '' &&
          !newEventCategories?.some(
            (rankedCategory) =>
              rankedCategory.category === data.secondaryEventType && rankedCategory.rank === 1,
          ))
      ) {
        // Categories were not created successfully.
        setErrorMsg(translate('Error.FailedToCreate'));
      }

      return { newId: newId ?? undefined, didSaveFail: !newId };
    },
    [translate, makeThumbnailsPublic, error, currentGame],
  );
};

export default useCreateEvent;
