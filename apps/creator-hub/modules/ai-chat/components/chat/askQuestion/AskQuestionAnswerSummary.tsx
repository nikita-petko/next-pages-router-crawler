import type { FC } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import type { AskQuestionAnswer } from '@modules/analytics-assistant/types/AskQuestion';
import { deriveQuestionDisplayText } from '@modules/analytics-assistant/utils/buildAskQuestionAnswer';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

// Separates each question's answer when a card asked more than one.
const ANSWER_SEPARATOR = ' · ';

export interface AskQuestionAnswerSummaryProps {
  answer: AskQuestionAnswer;
}

/**
 * Renders a submitted clarifying-question answer as the creator's turn text —
 * the selected labels / free text per question (or the skipped placeholder),
 * so an answered card reads as a normal user message in the transcript.
 */
const AskQuestionAnswerSummary: FC<AskQuestionAnswerSummaryProps> = ({ answer }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const skippedLabel = tPendingTranslation(
    'Skipped',
    'Status shown for a clarifying question the creator chose to skip.',
    translationKey('Label.QuestionSkipped', TranslationNamespace.AnalyticsAssistant),
  );
  const text = answer.answers
    .map((questionAnswer) => deriveQuestionDisplayText(questionAnswer, skippedLabel))
    .join(ANSWER_SEPARATOR);
  return <span>{text}</span>;
};

export default AskQuestionAnswerSummary;
