import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo } from 'react';
import { isAskQuestionAnswerPart } from '@modules/analytics-assistant/adapters/streamingProtocol/adaptAskQuestionPart';
import MarkdownContent from '@modules/analytics-assistant/components/markdown/MDX';
import { useGetAnalyticsChatMessageContent } from '@modules/analytics-assistant/hooks/useGetAnalyticsChatMessageContent';
import type { AnalyticsChatMessage } from '@modules/analytics-assistant/types/AnalyticsChatTypes';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { useAIChatContext } from '../../providers/AIChatProvider';
import useAIChatInterfaceStyles from './AIChatInterface.styles';
import AIChatMessageFeedback from './AIChatMessageFeedback';
import AskQuestionAnswerSummary from './askQuestion/AskQuestionAnswerSummary';
import ThinkingSteps from './thinking/ThinkingSteps';

interface AIChatMessageProps {
  message: AnalyticsChatMessage;
  isLastAssistantMessage: boolean;
}

const CANVAS_CLASS_NAME = 'flex flex-col width-full gap-medium';
const INTERACTIVE_ELEMENT_SELECTOR = 'a, button, input, select, textarea, [role="button"]';

const AIChatMessage: FC<AIChatMessageProps> = ({ message, isLastAssistantMessage }) => {
  const {
    conversationId,
    registerMessageArtifacts,
    unregisterMessageArtifacts,
    selectMessageArtifact,
    selectedMessageId,
    status,
  } = useAIChatContext();
  const { id: universeId } = useUniverseResource();
  const {
    classes: {
      messageWrapper,
      userMessageWrapper,
      assistantMessageWrapper,
      messageCard,
      userMessageCard,
      assistantMessageCard,
      interactiveAssistantMessageCard,
    },
    cx,
  } = useAIChatInterfaceStyles();

  const isUserMessage = message.role === 'user';
  const isAssistantMessage = message.role === 'assistant';
  const isSelected = selectedMessageId === message.id;
  const isMessageLoading =
    isLastAssistantMessage && (status === 'submitted' || status === 'streaming');

  const { textContent, chartElements, thinkingSteps, askQuestion } =
    useGetAnalyticsChatMessageContent(message, universeId, conversationId, {
      finalizeInProgress: !isMessageLoading,
    });
  const canvas = useMemo(() => {
    return chartElements.length > 0 ? (
      <div className={CANVAS_CLASS_NAME}>{chartElements}</div>
    ) : null;
  }, [chartElements]);
  const isInteractiveArtifactMessage = isAssistantMessage && canvas !== null;

  useEffect(() => {
    if (canvas === null) {
      unregisterMessageArtifacts(message.id);
      return;
    }

    registerMessageArtifacts(message.id, canvas);
  }, [canvas, message.id, registerMessageArtifacts, unregisterMessageArtifacts]);

  useEffect(() => {
    return () => unregisterMessageArtifacts(message.id);
  }, [message.id, unregisterMessageArtifacts]);

  const handleSelectMessageArtifact = useCallback(() => {
    selectMessageArtifact(message.id);
  }, [message.id, selectMessageArtifact]);

  const shouldIgnoreNestedInteraction = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (!(event.target instanceof HTMLElement)) {
      return false;
    }

    const nestedInteractiveElement = event.target.closest(INTERACTIVE_ELEMENT_SELECTOR);
    return nestedInteractiveElement !== null && nestedInteractiveElement !== event.currentTarget;
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (shouldIgnoreNestedInteraction(event)) {
        return;
      }

      handleSelectMessageArtifact();
    },
    [handleSelectMessageArtifact, shouldIgnoreNestedInteraction],
  );

  // A submitted answer arrives as a data-only user turn; render it as the
  // creator's message text. The interactive card itself is rendered once by
  // AIChatInterface, docked above the input — never inline here.
  const answerPart = message.parts.find(isAskQuestionAnswerPart);

  const messageContent = isInteractiveArtifactMessage ? (
    <button
      type='button'
      aria-pressed={isSelected}
      onClick={handleClick}
      className={cx(
        'text-body-medium',
        messageCard,
        assistantMessageCard,
        interactiveAssistantMessageCard,
      )}>
      <MarkdownContent content={textContent} />
    </button>
  ) : (
    <article
      aria-label={isUserMessage ? 'User message' : 'Assistant message'}
      className={cx(
        'text-body-medium',
        messageCard,
        isUserMessage ? userMessageCard : assistantMessageCard,
      )}>
      {isUserMessage && answerPart ? (
        <AskQuestionAnswerSummary answer={answerPart.data} />
      ) : (
        <MarkdownContent content={textContent} />
      )}
    </article>
  );

  const thinkingDurationMs = message.metadata?.thinkingDurationMs ?? undefined;
  const turnStartedAtMs = message.metadata?.turnStartedAtMs ?? undefined;
  const showThinking =
    isAssistantMessage &&
    (thinkingSteps.length > 0 || isMessageLoading || thinkingDurationMs != null);

  const showFeedback = isAssistantMessage && !isMessageLoading;

  return (
    <div
      data-message-id={message.id}
      className={cx(messageWrapper, isUserMessage ? userMessageWrapper : assistantMessageWrapper)}>
      {showThinking ? (
        <div className='width-full'>
          <ThinkingSteps
            steps={thinkingSteps}
            isRunning={isMessageLoading}
            thinkingDurationMs={thinkingDurationMs}
            turnStartedAtMs={turnStartedAtMs}
          />
          {textContent && messageContent}
        </div>
      ) : (
        // Suppress an empty bubble on a card-only assistant turn (no summary text).
        (textContent || !askQuestion) && messageContent
      )}
      {showFeedback ? (
        <AIChatMessageFeedback messageId={message.id} messageText={textContent} />
      ) : null}
    </div>
  );
};

export default AIChatMessage;
