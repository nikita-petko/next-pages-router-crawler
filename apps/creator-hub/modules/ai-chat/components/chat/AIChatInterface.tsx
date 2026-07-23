import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IconButton } from '@rbx/foundation-ui';
import { withTranslation } from '@rbx/intl';
import { Alert, Card, CardContent, Typography } from '@rbx/ui';
import AssistantDisclaimer from '@modules/analytics-assistant/components/disclaimer/AssistantDisclaimer';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useAIChatContext } from '../../providers/AIChatProvider';
import AIChatHomePage from './AIChatHomePage';
import AIChatInput from './AIChatInput';
import useAIChatInterfaceStyles from './AIChatInterface.styles';
import AIChatMessage from './AIChatMessage';
import AIChatReviewArtifactsChip from './AIChatReviewArtifactsChip';
import { useStickToBottom } from './useStickToBottom';

const AIChatInterface: FC = () => {
  const {
    classes: { contentContainer, card, cardContent, messagesContainer, messagesContent },
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
            <div ref={contentRef} className={messagesContent}>
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
