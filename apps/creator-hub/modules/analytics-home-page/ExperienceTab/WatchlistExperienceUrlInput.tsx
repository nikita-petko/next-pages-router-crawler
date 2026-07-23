import React, { ReactElement, useCallback } from 'react';
import {
  AddExperienceError,
  ExperienceUrlInput,
  useAnalyticsWatchlist,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const WatchlistItemLimit = 9;

const WatchlistExperienceUrlInput = (): ReactElement => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { addItem, watchlistContains, currentWatchlist } = useAnalyticsWatchlist();

  const addExperienceToWatchlist = useCallback(
    async (experienceId: number) => {
      const id = experienceId.toString();
      if (watchlistContains(id)) {
        throw new AddExperienceError(
          translate(
            translationKey('Message.ExperienceAlreadyInWatchlist', TranslationNamespace.Analytics),
          ),
        );
      }
      if (
        currentWatchlist?.watchlistItems?.itemIds !== undefined &&
        currentWatchlist.watchlistItems.itemIds.length >= WatchlistItemLimit
      ) {
        throw new AddExperienceError(
          translate(
            translationKey(
              'Message.ExperienceWatchlistLimitReached',
              TranslationNamespace.Analytics,
            ),
          ),
        );
      }
      await addItem(id);
    },
    [addItem, currentWatchlist?.watchlistItems?.itemIds, translate, watchlistContains],
  );

  return <ExperienceUrlInput addExperience={addExperienceToWatchlist} />;
};

export default WatchlistExperienceUrlInput;
