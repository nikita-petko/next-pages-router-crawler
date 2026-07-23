import React, { FC, useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { Alert, Card, CardContent, Divider, Typography } from '@rbx/ui';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AssistantDisclaimer from '@modules/analytics-assistant/components/disclaimer/AssistantDisclaimer';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { translationKey } from '@modules/analytics-translations';
import { useAIChatContext } from '../../providers/AIChatProvider';
import AIChatMessage from './AIChatMessage';
import AIChatHomePage from './AIChatHomePage';
import AIChatInput from './AIChatInput';
import useAIChatInterfaceStyles from './AIChatInterface.styles';

const AIChatInterface: FC = () => {
  const {
    classes: {
      contentContainer,
      card,
      cardContent,
      messagesContainer,
      relativeCardContent,
      assistantTitle,
      spacer,
      dividerWithSpacing,
    },
    cx,
  } = useAIChatInterfaceStyles();
  const { translate } = useRAQIV2TranslationDependencies();
  const { messages, status, error, sendMessage, canvasElement } = useAIChatContext();

  const [inputValue, setInputValue] = useState('');
  const isLoading = status === 'streaming' || status === 'submitted';
  const hasChartVisible = canvasElement !== null;
  const hasMessages = messages.length > 0;

  const handleSendMessage = useCallback(() => {
    if (inputValue.trim() && !isLoading) {
      sendMessage({ text: inputValue.trim() });
      setInputValue('');
    }
  }, [inputValue, isLoading, sendMessage]);

  const handleQuestionSelect = useCallback(
    (question: string) => {
      if (!isLoading) {
        sendMessage({ text: question });
      }
    },
    [isLoading, sendMessage],
  );

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Find the last assistant message for streaming indicator
  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'assistant') {
        return messages[i].id;
      }
    }
    return null;
  }, [messages]);

  return (
    <div className={contentContainer}>
      <Card className={card}>
        <CardContent className={cx(cardContent, relativeCardContent)}>
          {hasChartVisible && (
            <Typography variant='captionHeader' color='secondary' className={assistantTitle}>
              {translate(
                translationKey('Label.InsightsChat', TranslationNamespace.AnalyticsAssistant),
              )}
            </Typography>
          )}
          {error && (
            <Alert severity='error'>
              <Typography variant='body2'>{error.message}</Typography>
            </Alert>
          )}
          {hasChartVisible && (
            <React.Fragment>
              <div className={spacer} />
              <Divider className={dividerWithSpacing} />
            </React.Fragment>
          )}
          <div className={messagesContainer} ref={messagesContainerRef}>
            {!hasMessages && <AIChatHomePage onQuestionSelect={handleQuestionSelect} />}

            {messages.map((message) => (
              <AIChatMessage
                key={message.id}
                message={message}
                isLastAssistantMessage={message.id === lastAssistantMessageId}
              />
            ))}
          </div>

          <AIChatInput
            inputValue={inputValue}
            onInputChange={setInputValue}
            onKeyPress={handleKeyPress}
            onSend={handleSendMessage}
            isLoading={isLoading}
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
