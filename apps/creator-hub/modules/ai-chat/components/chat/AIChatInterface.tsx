import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconButton } from '@rbx/foundation-ui';
import { withTranslation } from '@rbx/intl';
import { Alert, Card, CardContent, Typography } from '@rbx/ui';
import { adaptAskQuestionParts } from '@modules/analytics-assistant/adapters/streamingProtocol/adaptAskQuestionPart';
import AssistantDisclaimer from '@modules/analytics-assistant/components/disclaimer/AssistantDisclaimer';
import {
  AnalyticsChatDataPartType,
  type AskQuestionAnswerDataPart,
} from '@modules/analytics-assistant/types/AnalyticsChatTypes';
import type { AskQuestionAnswer } from '@modules/analytics-assistant/types/AskQuestion';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useAIChatContext } from '../../providers/AIChatProvider';
import AIChatHomePage from './AIChatHomePage';
import AIChatInput from './AIChatInput';
import useAIChatInterfaceStyles from './AIChatInterface.styles';
import AIChatMessage from './AIChatMessage';
import AIChatReviewArtifactsChip from './AIChatReviewArtifactsChip';
import AskQuestionCard from './askQuestion/AskQuestionCard';
import { useStickToBottom } from './useStickToBottom';

const AIChatInterface: FC = () => {
  const {
    classes: { contentContainer, card, cardContent, messagesContainer, messagesContent, composer },
  } = useAIChatInterfaceStyles();
  const {
    messages,
    status,
    error,
    sendMessage,
    stopGeneration,
    canSendMessage,
    registerArtifactScrollHandler,
    canvasElement,
  } = useAIChatContext();
  const { tPendingTranslation } = useRAQIV2TranslationDependencies();

  const [inputValue, setInputValue] = useState('');
  const isLoading = status === 'streaming' || status === 'submitted';
  const isInputDisabled = isLoading || !canSendMessage;
  const hasMessages = messages.length > 0;
  const hasCanvas = canvasElement !== null;

  // The clarifying-question card docks above the input while the trailing
  // assistant turn carries a pending ask and the viewer can answer. Once
  // answered, the answer turn appends and this turn is no longer trailing, so
  // the card clears on its own.
  const trailingMessage = messages[messages.length - 1];
  const pendingAsk = useMemo(() => {
    if (!trailingMessage || trailingMessage.role !== 'assistant' || isLoading || !canSendMessage) {
      return null;
    }
    return adaptAskQuestionParts(trailingMessage.parts);
  }, [trailingMessage, isLoading, canSendMessage]);

  // The composer (card + input) floats over the transcript; pad the message list
  // by the composer's live height so the newest message can scroll clear of it.
  const composerRef = useRef<HTMLDivElement>(null);
  const [composerHeight, setComposerHeight] = useState(0);

  const readOnlyTooltip = tPendingTranslation(
    'Only the conversation owner can send messages in this chat.',
    'Tooltip shown on the disabled chat input when a user can view a shared AI chat conversation but cannot send messages.',
    translationKey(
      'Message.AIChat.SharedConversationReadOnly',
      TranslationNamespace.AnalyticsAssistant,
    ),
  );

  const scrollToBottomLabel = tPendingTranslation(
    'Scroll to latest',
    'Accessible label for the button that jumps the AI chat message list to the newest message.',
    translationKey('Label.AIChat.ScrollToBottom', TranslationNamespace.AnalyticsAssistant),
  );

  const genericErrorMessage = tPendingTranslation(
    'Something went wrong. Please try again.',
    'Generic error banner shown in the analytics AI chat when a message request fails, instead of the raw error detail.',
    translationKey('Message.AIChat.GenericError', TranslationNamespace.AnalyticsAssistant),
  );

  const { scrollRef, contentRef, isPinned, handleScroll, pinToBottom, releasePin } =
    useStickToBottom(messages);

  const handleSendMessage = useCallback(() => {
    if (inputValue.trim() && !isInputDisabled) {
      sendMessage({ text: inputValue.trim() });
      setInputValue('');
      pinToBottom();
    }
  }, [inputValue, isInputDisabled, sendMessage, pinToBottom]);

  const handleQuestionSelect = useCallback(
    (question: string) => {
      if (!isInputDisabled) {
        sendMessage({ text: question });
        pinToBottom();
      }
    },
    [isInputDisabled, sendMessage, pinToBottom],
  );

  const handleScrollToBottomClick = useCallback(() => pinToBottom('smooth'), [pinToBottom]);

  // Submitting or skipping the card posts a data-only user turn carrying the
  // structured answer; the backend derives the transcript text from it.
  const handleAnswerSubmit = useCallback(
    (answer: AskQuestionAnswer) => {
      const answerPart: AskQuestionAnswerDataPart = {
        type: AnalyticsChatDataPartType.AskQuestionAnswer,
        id: answer.askId,
        data: answer,
      };
      sendMessage({ parts: [answerPart] });
      pinToBottom();
    },
    [sendMessage, pinToBottom],
  );

  useEffect(() => {
    const composerEl = composerRef.current;
    if (typeof ResizeObserver === 'undefined' || !composerEl) {
      return undefined;
    }
    const updateHeight = () => setComposerHeight(composerEl.offsetHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(composerEl);
    return () => observer.disconnect();
  }, []);

  const scrollToArtifactMessage = useCallback(
    (messageId: string) => {
      const container = scrollRef.current;
      if (!container) {
        return;
      }

      const target = container.querySelector(`[data-message-id="${messageId}"]`);
      if (!target) {
        return;
      }

      releasePin();
      const delta = target.getBoundingClientRect().top - container.getBoundingClientRect().top;
      container.scrollTo({ top: container.scrollTop + delta, behavior: 'smooth' });
    },
    [scrollRef, releasePin],
  );

  useEffect(() => {
    registerArtifactScrollHandler(scrollToArtifactMessage);
    return () => registerArtifactScrollHandler(null);
  }, [registerArtifactScrollHandler, scrollToArtifactMessage]);

  // The actively-generating assistant message is always the trailing message.
  // Matching the last *assistant* message instead would momentarily flag the
  // previous turn as loading during the 'submitted' gap before the new
  // assistant message exists, briefly auto-expanding its thinking panel.
  const activeAssistantMessageId = useMemo(() => {
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.role === 'assistant' ? lastMessage.id : null;
  }, [messages]);

  return (
    <div className={contentContainer}>
      <Card className={card}>
        <CardContent className={cardContent}>
          {error && (
            <Alert severity='error'>
              <Typography variant='body2'>{genericErrorMessage}</Typography>
            </Alert>
          )}
          <div className={messagesContainer} ref={scrollRef} onScroll={handleScroll}>
            <div
              ref={contentRef}
              className={messagesContent}
              style={{ paddingBottom: composerHeight }}>
              {!hasMessages && <AIChatHomePage onQuestionSelect={handleQuestionSelect} />}

              {messages.map((message) => (
                <AIChatMessage
                  key={message.id}
                  message={message}
                  isLastAssistantMessage={message.id === activeAssistantMessageId}
                />
              ))}
            </div>
          </div>

          <div className={composer} ref={composerRef}>
            {(hasCanvas || !isPinned) && (
              <div
                className={`flex items-center padding-y-xsmall gap-medium ${
                  hasCanvas ? 'justify-start' : 'justify-center'
                }`}>
                <AIChatReviewArtifactsChip />
                {!isPinned && (
                  <IconButton
                    type='button'
                    variant='Standard'
                    size='Small'
                    isCircular
                    className='shrink-0 !bg-shift-300'
                    icon='icon-regular-chevron-large-down'
                    ariaLabel={scrollToBottomLabel}
                    onClick={handleScrollToBottomClick}
                  />
                )}
              </div>
            )}
            {pendingAsk && (
              <AskQuestionCard askQuestion={pendingAsk} onSubmit={handleAnswerSubmit} />
            )}
            <AIChatInput
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSend={handleSendMessage}
              onStop={stopGeneration}
              isLoading={isLoading}
              isDisabled={!canSendMessage}
              disabledTooltip={!canSendMessage ? readOnlyTooltip : undefined}
            />
            <AssistantDisclaimer />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default withTranslation(AIChatInterface, [
  TranslationNamespace.Analytics,
  TranslationNamespace.DocsAssistant,
  TranslationNamespace.AnalyticsAssistant,
  TranslationNamespace.Insights,
  TranslationNamespace.Navigation,
]);
