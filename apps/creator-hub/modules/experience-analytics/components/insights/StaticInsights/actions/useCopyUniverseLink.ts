import { useState, useCallback } from 'react';
import gamesClient from '@modules/clients/games';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { app } from '@modules/miscellaneous/urls';
import useInsightsSnackbar from '../../useInsightsSnackbar';

const namespace = TranslationNamespace.Insights;

/**
 * Copies a universe's URL into clipboard.
 */
const useCopyUniverseLink = (universeId: number) => {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isError, setError] = useState<boolean>(false);
  const { showSnackbar } = useInsightsSnackbar();
  const { translate } = useRAQIV2TranslationDependencies();
  const copyLink = useCallback(async () => {
    setLoading(true);
    try {
      const response = await gamesClient.getDetails([universeId]);
      if (response.data == null || response.data.length === 0) {
        setError(true);
        return;
      }

      const [{ rootPlaceId }] = response.data;
      if (rootPlaceId == null) {
        setError(true);
        return;
      }

      const url = app.getGameDetailsUrl(universeId, rootPlaceId);

      await navigator.clipboard.writeText(url);

      showSnackbar(translate({ key: 'Action.CopyLink.Snackbar.Success', namespace }), true);
    } catch {
      setError(true);
      showSnackbar(translate({ key: 'Action.CopyLink.Snackbar.Failure', namespace }), false);
    } finally {
      setLoading(false);
    }
  }, [translate, showSnackbar, universeId]);

  return { isLoading, isError, copyLink };
};

export default useCopyUniverseLink;
