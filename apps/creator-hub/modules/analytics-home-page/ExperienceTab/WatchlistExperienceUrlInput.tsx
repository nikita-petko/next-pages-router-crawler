import type { ReactElement } from 'react';
import { useCallback } from 'react';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ExperienceUrlInput, {
  AddExperienceError,
} from '@modules/experience-analytics-shared/components/ExperienceUrlInput/ExperienceUrlInput';
import { useAnalyticsWatchlist } from '@modules/experience-analytics-shared/context/AnalyticsWatchlistProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
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
