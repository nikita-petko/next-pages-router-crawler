import React, { FC, useEffect, useCallback, useMemo } from 'react';
import { Grid, Typography } from '@rbx/ui';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import MDX from '@modules/analytics-assistant/components/markdown/MDX';
import { useGetAnalyticsChatMessageContent } from '@modules/analytics-assistant/hooks/useGetAnalyticsChatMessageContent';
import type { AnalyticsChatMessage } from '@modules/analytics-assistant/types/AnalyticsChatTypes';
import { useAIChatContext } from '../../providers/AIChatProvider';
import useAIChatInterfaceStyles from './AIChatInterface.styles';
import ThinkingSteps from './thinking/ThinkingSteps';

interface AIChatMessageProps {
  message: AnalyticsChatMessage;
  isLastAssistantMessage: boolean;
}

const AIChatMessage: FC<AIChatMessageProps> = ({ message, isLastAssistantMessage }) => {
  const { setSelectedMessage, selectedMessageId, status } = useAIChatContext();
  const { id: universeId } = useUniverseResource();
  const {
    classes: {
      messageWrapper,
      userMessageWrapper,
      assistantMessageWrapper,
      messageCard,
      userMessageCard,
      assistantMessageCard,
      selectedMessageCard,
    },
    cx,
  } = useAIChatInterfaceStyles();

  const isUserMessage = message.role === 'user';
  const isAssistantMessage = message.role === 'assistant';
  const isSelected = selectedMessageId === message.id;

  const { textContent, chartElements, thinkingSteps } = useGetAnalyticsChatMessageContent(
    message,
    universeId,
  );
  const canvas = useMemo(() => {
    return chartElements.length > 0 ? (
      <Grid container direction='row' spacing={2} XSmall={12}>
        {chartElements}
      </Grid>
    ) : null;
  }, [chartElements]);

  // Auto-select when this is the last assistant message with charts
  const shouldAutoSelect = isLastAssistantMessage && canvas != null;
  useEffect(() => {
    if (shouldAutoSelect) {
      setSelectedMessage(message.id, canvas);
    }
  }, [shouldAutoSelect, canvas, message.id, setSelectedMessage, chartElements]);

  // Handle manual click selection
  const handleClick = useCallback(() => {
    setSelectedMessage(message.id, canvas);
  }, [canvas, message.id, setSelectedMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleClick();
      }
    },
    [handleClick],
  );

  const messageContent = (
    <Typography
      variant='body2'
      role='article'
      aria-label={isUserMessage ? 'User message' : 'Assistant message'}
      className={cx(
        messageCard,
        isUserMessage ? userMessageCard : assistantMessageCard,
        isSelected ? selectedMessageCard : undefined,
      )}
      onClick={isAssistantMessage ? handleClick : undefined}
      onKeyDown={isAssistantMessage ? handleKeyDown : undefined}
      tabIndex={isAssistantMessage ? 0 : undefined}
      style={{
        whiteSpace: 'pre-wrap',
        cursor: isAssistantMessage ? 'pointer' : 'default',
      }}>
      <MDX content={textContent} />
    </Typography>
  );

  const isMessageLoading =
    isLastAssistantMessage && (status === 'submitted' || status === 'streaming');
  const showThinking =
    isAssistantMessage && (thinkingSteps.length > 0 || (isMessageLoading && !textContent));

  return (
    <div
      className={cx(messageWrapper, isUserMessage ? userMessageWrapper : assistantMessageWrapper)}>
      {showThinking ? (
        <div style={{ width: '100%' }}>
          <ThinkingSteps steps={thinkingSteps} isLoading={isMessageLoading && !textContent} />
          {textContent && messageContent}
        </div>
      ) : (
        messageContent
      )}
    </div>
  );
};

export default AIChatMessage;
