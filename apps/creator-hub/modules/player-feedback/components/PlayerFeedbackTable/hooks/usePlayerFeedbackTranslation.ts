import { useCallback, useMemo, useState } from 'react';
import type { ExperienceReview } from '@rbx/client-player-generated-reviews-service/v1';
import { Locale, useLocalization } from '@rbx/intl';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { useTranslateComment } from '@modules/react-query/playerFeedback/playerFeedbackQueries';
import {
  translationRetryLimit,
  translationRetryDelay,
} from '../constants/PlayerFeedbackTranslationConfigs';

interface TranslationState {
  showTranslation: boolean;
  isTranslating: boolean;
  translationData?: { translatedComment?: string };
}

const usePlayerFeedbackTranslation = (reviews: ExperienceReview[]) => {
  const { locale } = useLocalization();
  const { params: ixpParams } = useIXPParameters(IXPLayers.CreatorDashboard);
  const { mutate: translateComment } = useTranslateComment();

  // Store translation state for each review by review ID
  const [translationStates, setTranslationStates] = useState<Map<string, TranslationState>>(
    new Map(),
  );

  // Language family code is different for chinese variants
  const languageCode = useMemo(() => {
    if (locale === Locale.SimplifiedChinese) {
      return 'zh-hans';
    }
    if (locale === Locale.TraditionalChinese) {
      return 'zh-hant';
    }
    return locale?.slice(0, 2) || 'en';
  }, [locale]);

  // Initialize translation states for new reviews
  useMemo(() => {
    const newStates = new Map(translationStates);
    let hasChanges = false;

    reviews.forEach((review) => {
      if (!newStates.has(review.id)) {
        newStates.set(review.id, {
          showTranslation: false,
          isTranslating: false,
          translationData: undefined,
        });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setTranslationStates(newStates);
    }
  }, [reviews, translationStates]);

  // Update translation state for a specific review
  const updateTranslationState = useCallback(
    (reviewId: string, updates: Partial<TranslationState>) => {
      setTranslationStates((prev) => {
        const newStates = new Map(prev);
        const currentState = newStates.get(reviewId) || {
          showTranslation: false,
          isTranslating: false,
        };
        newStates.set(reviewId, { ...currentState, ...updates });
        return newStates;
      });
    },
    [],
  );

  // Translation logic
  const performTranslation = useCallback(
    (reviewId: string, currentAttempts: number = 0) => {
      translateComment(
        { reviewId, targetLanguage: languageCode },
        {
          onSuccess: (data: { translatedComment?: string }) => {
            if (!data.translatedComment) {
              // translatedComment did not exist, backend will have created the content settings, retry after a delay
              if (
                ixpParams?.EnablePlayerFeedbackTranslationRetries &&
                currentAttempts < translationRetryLimit
              ) {
                setTimeout(() => {
                  performTranslation(reviewId, currentAttempts + 1);
                }, translationRetryDelay);
              } else {
                // Maximum translation retry attempts reached, stop translating
                updateTranslationState(reviewId, { isTranslating: false });
              }
            } else {
              updateTranslationState(reviewId, {
                showTranslation: true,
                isTranslating: false,
                translationData: data,
              });
            }
          },
          onError: () => {
            updateTranslationState(reviewId, { isTranslating: false });
          },
        },
      );
    },
    [translateComment, languageCode, ixpParams, updateTranslationState],
  );

  // Get translation state for a specific review
  const getTranslationState = useCallback(
    (reviewId: string) => {
      const state = translationStates.get(reviewId) || {
        showTranslation: false,
        isTranslating: false,
      };

      const onClickTranslateComment = () => {
        if (state.showTranslation) {
          updateTranslationState(reviewId, { showTranslation: false });
        } else if (state.translationData && state.translationData.translatedComment) {
          updateTranslationState(reviewId, { showTranslation: true });
        } else if (!state.isTranslating) {
          updateTranslationState(reviewId, { isTranslating: true });
          performTranslation(reviewId);
        }
        // If they click the translate button while it is already translating, don't do anything
      };

      return {
        showTranslation: state.showTranslation,
        isTranslating: state.isTranslating,
        translationData: state.translationData,
        onClickTranslateComment,
      };
    },
    [translationStates, updateTranslationState, performTranslation],
  );

  return {
    getTranslationState,
  };
};

export default usePlayerFeedbackTranslation;
