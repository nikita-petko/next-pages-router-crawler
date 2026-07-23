import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { EntryIdentifierWithTranslations, localizationTableClient } from '@modules/clients';
import { GetTranslationFeedbackResponse } from '@modules/clients/localizationTables';
import { useState } from 'react';
import { TranslationFeedback, GameStringTranslationInfo } from '../types';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import ReporterType from '../enums/ReporterType';

const useTranslationFeedback = () => {
  const { error } = useMetricsMonitoring();
  const { entryTableId, gameId } = useEntryManagementMetadata();
  const [isFeedbackLoading, setIsFeedbackLoading] = useState<boolean>(false);
  const [feedbackFetchingError, setFeedbackFetchingError] = useState<Error | null>(null);
  const [translationFeedback, setTranslationFeedback] = useState<TranslationFeedback[]>([]);

  const getTranslationFeedback = (
    getFeedbackResponse: GetTranslationFeedbackResponse,
  ): TranslationFeedback[] => {
    const feedback: TranslationFeedback[] = [];

    if (getFeedbackResponse && getFeedbackResponse.entries) {
      const entry = getFeedbackResponse.entries[0];
      const playerSuggestions = entry.playerSuggestionText ?? [];

      if (playerSuggestions.length > 0 && playerSuggestions[0] !== '' && entry.reasons) {
        const manualFeedback: TranslationFeedback = {
          suggestion: playerSuggestions[0],
          suggestionCount: entry.feedbackCount,
          reason: entry.reasons[0],
          reporterType: ReporterType.Player,
        };
        feedback.push(manualFeedback);
      }

      const robloxSuggestion = entry.robloxSuggestionText ?? '';
      if (robloxSuggestion !== '') {
        const robloxFeedback: TranslationFeedback = {
          suggestion: robloxSuggestion,
          reporterType: ReporterType.Roblox,
        };
        feedback.push(robloxFeedback);
      }
    }
    return feedback;
  };

  const getEntryTranslationFeedback = async (
    sourceLocale: string | null,
    currentLanguageOrLocaleCode: string | null,
    entryInfo: GameStringTranslationInfo,
  ) => {
    setIsFeedbackLoading(true);
    setFeedbackFetchingError(null);
    setTranslationFeedback([]);

    if (sourceLocale !== null && currentLanguageOrLocaleCode !== null && gameId !== null) {
      const entryIdentifier: EntryIdentifierWithTranslations = {
        source: entryInfo.sourceText,
        context: entryInfo.context ?? '',
        key: entryInfo.key ?? '',
        translation: {
          locale: currentLanguageOrLocaleCode,
          translationText: entryInfo.currentTranslation ?? '',
        },
      };
      try {
        const translationFeedbackResponse = await localizationTableClient.getTranslationFeedback({
          tableId: entryTableId,
          gameId,
          request: {
            sourceLocale,
            entries: [entryIdentifier],
          },
        });
        setTranslationFeedback(getTranslationFeedback(translationFeedbackResponse));
      } catch (ex) {
        const catchedError = ex as Error;
        error(catchedError.message);
        setFeedbackFetchingError(catchedError);
      } finally {
        setIsFeedbackLoading(false);
      }
    }

    return null;
  };

  return {
    isFeedbackLoading,
    feedbackFetchingError,
    translationFeedback,
    getEntryTranslationFeedback,
  };
};

export default useTranslationFeedback;
