import type { FC } from 'react';
import React, { useCallback, useState } from 'react';
import { FeedbackRating } from '@rbx/conv-ai-provider';
import { IconButton, Typography } from '@rbx/ui';
import FeedbackDialog from '@modules/analytics-assistant/components/feedback/FeedbackDialogue';
import FeedbackNegativeIcon from '@modules/analytics-assistant/components/feedback/FeedbackNegativeIcon';
import FeedbackPositiveIcon from '@modules/analytics-assistant/components/feedback/FeedbackPositiveIcon';
import {
  AssistantClickEventName,
  logAssistantEvent,
} from '@modules/analytics-assistant/utils/AssistantLogger';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { createAnalyticsAssistantFeedback } from '@modules/clients/analytics';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useAIChatContext } from '../../providers/AIChatProvider';
import styles from './AIChatMessageFeedback.module.css';

const FEEDBACK_DIALOGUE_CHARACTER_LIMIT = 500;

const buildFeedbackUrl = (conversationId: string | undefined, messageId: string): string => {
  const url = new URL(window.location.href);
  if (conversationId) {
    url.searchParams.set('conversationId', conversationId);
  }
  url.searchParams.set('messageId', messageId);
  return url.toString();
};

const toFeedbackVoteOption = (rating: FeedbackRating): string =>
  rating === FeedbackRating.Positive ? 'positive' : 'negative';

interface AIChatMessageFeedbackProps {
  messageId: string;
  messageText: string;
}

const AIChatMessageFeedback: FC<AIChatMessageFeedbackProps> = ({ messageId, messageText }) => {
  const { conversationId, submittedFeedbackByMessageId, markMessageFeedbackSubmitted } =
    useAIChatContext();
  const { id: universeId } = useUniverseResource();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { translate } = useRAQIV2TranslationDependencies();

  const [rating, setRating] = useState<FeedbackRating>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const submittedRating = submittedFeedbackByMessageId[messageId];

  const closeFeedbackDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleRatingClick = useCallback(
    (ratingValue: FeedbackRating) => {
      if (submittedRating !== undefined) {
        return;
      }

      setRating(ratingValue);
      setDialogOpen(true);

      logAssistantEvent(unifiedLogger, AssistantClickEventName.AssistantChatFeedback, {
        universeId,
        conversationId: conversationId ?? '',
        messageId,
        rating: ratingValue,
        feedbackId: messageId,
        message: messageText,
      });
    },
    [conversationId, messageId, messageText, submittedRating, unifiedLogger, universeId],
  );

  const handlePositiveClick = useCallback(() => {
    handleRatingClick(FeedbackRating.Positive);
  }, [handleRatingClick]);

  const handleNegativeClick = useCallback(() => {
    handleRatingClick(FeedbackRating.Negative);
  }, [handleRatingClick]);

  const handleSubmit = useCallback(
    ({
      rating: submitRating,
      additionalDetails,
    }: {
      rating: FeedbackRating;
      additionalDetails: string;
    }) => {
      void createAnalyticsAssistantFeedback({
        url: buildFeedbackUrl(conversationId, messageId),
        feedbackId: messageId,
        feedbackOption: toFeedbackVoteOption(submitRating),
        feedbackDetails: additionalDetails,
      });
      markMessageFeedbackSubmitted(messageId, submitRating);
    },
    [conversationId, markMessageFeedbackSubmitted, messageId],
  );

  const isSubmitted = submittedRating !== undefined;

  return (
    <>
      <div className={styles.feedbackActions}>
        <Typography variant='caption' color='secondary'>
          {translate(translationKey('Label.Assistant.Feedback', TranslationNamespace.Analytics))}
        </Typography>
        <IconButton
          aria-label='ThumbUp'
          color='secondary'
          size='small'
          disabled={isSubmitted}
          onClick={handlePositiveClick}>
          <FeedbackPositiveIcon filled={submittedRating === FeedbackRating.Positive} size={16} />
        </IconButton>
        <IconButton
          aria-label='ThumbDown'
          color='secondary'
          size='small'
          disabled={isSubmitted}
          onClick={handleNegativeClick}>
          <FeedbackNegativeIcon filled={submittedRating === FeedbackRating.Negative} size={16} />
        </IconButton>
      </div>
      {dialogOpen && rating ? (
        <FeedbackDialog
          open={dialogOpen}
          rating={rating}
          feedbackId={messageId}
          characterLimit={FEEDBACK_DIALOGUE_CHARACTER_LIMIT}
          onClose={closeFeedbackDialog}
          onSubmit={handleSubmit}
        />
      ) : null}
    </>
  );
};

export default AIChatMessageFeedback;
