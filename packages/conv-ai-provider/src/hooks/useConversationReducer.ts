import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import conversationReducer, {
  ConversationActionType,
  conversationInitialState,
} from '../reducers/ConversationReducer';
import type {
  ConversationError,
  WSNotificationBotMessageClientAction,
  ConvAiConfig,
  Emitter,
  PromptMessage,
  FeedbackRating,
  MessageHistoryItem,
  RequestId,
  MessageId,
  SendUserPromptProps,
  RegenerateResponseProps,
} from '../types';
import { ConnectionState, MessageRole, MessageRequestType, ConversationLogEvent } from '../types';
import getResponseOrError from '../utils/getResponseOrError';
import { handleDispatchUserPromptError } from '../utils/handleErrorsUtils';

const useConversationReducer = ({
  emitter,
  convAiConfig,
}: {
  emitter: Emitter;
  convAiConfig: ConvAiConfig;
}) => {
  const [state, dispatch] = useReducer(conversationReducer, conversationInitialState);
  const isConnected = useMemo(
    () => state.connectionState === ConnectionState.Connected,
    [state.connectionState],
  );
  const { assistantOptIn, logConversationEvent } = useMemo(() => convAiConfig, [convAiConfig]);

  const { accepted: acceptedOptIn, process: processOptIn } = assistantOptIn;

  const matchesActiveRequest = useCallback(
    (requestId: RequestId) => {
      return isConnected && state.activeRequestId === requestId;
    },
    [state.activeRequestId, isConnected],
  );

  const onStartStreamingResponse = useCallback(
    (
      messageContent: string,
      messageId: MessageId,
      requestId: RequestId,
      actions: WSNotificationBotMessageClientAction[],
    ) => {
      if (!matchesActiveRequest(requestId)) {
        return;
      }

      dispatch({
        type: ConversationActionType.startStreamingResponse,
        streamingResponseContent: messageContent,
        messageId,
        requestId,
        actions,
      });

      const stateContext = {
        ...state,
        messageId: requestId,
        requestIdV2: requestId,
        messageIdV2: messageId,
      };
      logConversationEvent(ConversationLogEvent.BotStartStreamingResponse, stateContext);
    },
    [logConversationEvent, matchesActiveRequest, state],
  );

  const onFinishStreamingResponse = useCallback(
    (requestId: RequestId) => {
      if (!matchesActiveRequest(requestId)) {
        return;
      }
      if (!state.activeResponseMessage) {
        throw new Error(`Missing state activeResponseMessage`);
      }

      dispatch({
        type: ConversationActionType.finishStreamingResponse,
      });

      logConversationEvent(ConversationLogEvent.BotFinishStreamingResponse, state);
    },
    [logConversationEvent, matchesActiveRequest, state],
  );

  const onUpdateStreamingResponse = useCallback(
    (messageContent: string, requestId: RequestId) => {
      if (!matchesActiveRequest(requestId)) {
        return;
      }
      dispatch({
        type: ConversationActionType.updateStreamingResponse,
        streamingResponseContent: messageContent,
        requestId,
      });
    },
    [matchesActiveRequest],
  );

  const onErrorStreamingResponse = useCallback(
    (conversationError: ConversationError, messageId: MessageId) => {
      if (!matchesActiveRequest(messageId)) {
        return;
      }

      dispatch({
        type: ConversationActionType.activeMessageConversationError,
        error: conversationError,
      });

      logConversationEvent(ConversationLogEvent.BotErrorStreamingResponse, state, {
        error: conversationError,
      });
    },
    [logConversationEvent, matchesActiveRequest, state],
  );

  const onReconnecting = useCallback(() => {
    dispatch({
      type: ConversationActionType.connectionReconnecting,
    });
    logConversationEvent(ConversationLogEvent.ConnectionReconnecting, state);
  }, [logConversationEvent, state]);

  const onReconnected = useCallback(() => {
    dispatch({
      type: ConversationActionType.connectionConnected,
    });
    logConversationEvent(ConversationLogEvent.ConnectionReconnected, state);
  }, [logConversationEvent, state]);

  const onClosed = useCallback(() => {
    dispatch({
      type: ConversationActionType.connectionClose,
    });
    logConversationEvent(ConversationLogEvent.ConnectionClosed, state);
  }, [logConversationEvent, state]);

  useEffect(() => {
    emitter.on('startStreamingResponse', onStartStreamingResponse);
    emitter.on('finishStreamingResponse', onFinishStreamingResponse);
    emitter.on('updateStreamingResponse', onUpdateStreamingResponse);
    emitter.on('errorStreamingResponse', onErrorStreamingResponse);
    emitter.on('connectionReconnecting', onReconnecting);
    emitter.on('connectionConnected', onReconnected);
    emitter.on('connectionClose', onClosed);
    return () => {
      emitter.removeAllListeners();
    };
  }, [
    emitter,
    onStartStreamingResponse,
    onFinishStreamingResponse,
    onUpdateStreamingResponse,
    onErrorStreamingResponse,
    onReconnecting,
    onReconnected,
    onClosed,
  ]);

  const rateResponse = useCallback(
    (
      rating: FeedbackRating,
      message: MessageHistoryItem,
      comment?: string,
      additionalData?: Record<string, string>,
    ) => {
      dispatch({
        type: ConversationActionType.rateResponse,
        message,
        rating,
      });

      logConversationEvent(ConversationLogEvent.UserRateResponse, state, {
        rating,
        comment,
        message,
        ...additionalData,
      });
    },
    [logConversationEvent, state],
  );

  const stopResponse = useCallback(
    (textareaInput: string) => () => {
      if (!state.streaming) {
        throw new Error(`Cannot call Stop if not streaming`);
      }

      dispatch({
        type: ConversationActionType.stopStreamingResponse,
      });

      logConversationEvent(ConversationLogEvent.UserClickStop, state, {
        textareaInput,
      });
    },
    [logConversationEvent, state],
  );

  const withoutErroredMessages = useCallback(
    (messageHistory: MessageHistoryItem[]) =>
      messageHistory.filter((_, idx: number) => !state.errorByMessageHistoryIdx.get(idx)),
    [state.errorByMessageHistoryIdx],
  );

  const handleError = useCallback(
    ({
      thrown,
      message,
      actionType,
    }: {
      thrown: unknown;
      message: MessageHistoryItem;
      actionType: ConversationActionType;
    }) => {
      const responseOrError = getResponseOrError(thrown);
      handleDispatchUserPromptError(dispatch, responseOrError as Response);
      logConversationEvent(ConversationLogEvent.UserSubmitPromptResponseError, state, {
        error: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: (thrown as any).name ?? 'unknown',
          actionType: actionType.toString(),
          ...responseOrError,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        statusCode: `${(responseOrError as any).status}`,
        conversationId: state.conversationId ?? '',
        requestId: message.requestId,
      });
    },
    [logConversationEvent, state],
  );

  const regenerateResponse = useCallback(
    ({
      originalPrompt,
      message,
      messageLogParams,
      promptAssistantResponse,
    }: RegenerateResponseProps) => {
      logConversationEvent(ConversationLogEvent.UserStartsRegenerateMessage, state, {
        originalPrompt,
        message,
        ...messageLogParams,
      });
      const originalPromptRequestId = message.requestId;
      const messageToSend: PromptMessage = {
        content: originalPrompt,
        role: MessageRole.User,
        requestId: uuidv4(),
        messageId: uuidv4(),
        context: {
          ...message.context,
          requestType: MessageRequestType.RegenerationRequest,
          originalPrompt,
        },
        createTime: new Date().toISOString(),
      };

      (async () => {
        try {
          if (!state.conversationId) {
            throw new Error(`Conversation ID required to send a regenerate request`);
          }
          if (!originalPrompt) {
            throw new Error(`Original prompt required to send a regenerate request`);
          }

          // reset 'active' message pair to map to this prompt
          // and move formerly active message prompt+response pair to message history
          const messageHistory = [...state.messageHistory];
          if (state.activePromptMessage) {
            messageHistory.push(state.activePromptMessage);
          }
          if (state.activeResponseMessage) {
            messageHistory.push(state.activeResponseMessage);
          }

          dispatch({
            type: ConversationActionType.sendRegeneratePrompt,
            message: messageToSend,
            messageHistory,
            originalPrompt,
          });

          const stateContext = {
            ...state,
            messageHistory: withoutErroredMessages(messageHistory),
            activePromptMessage: messageToSend,
          };
          await promptAssistantResponse(stateContext);

          logConversationEvent(ConversationLogEvent.UserSubmitRegenerationPrompt, stateContext, {
            originalPromptRequestId: originalPromptRequestId ?? '',
            role: String(messageToSend.role ?? ''),
            messageId: messageToSend.requestId,
            requestIdV2: messageToSend.requestId,
            messageIdV2: messageToSend.messageId,
            conversationId: state.conversationId ?? '',
          });
        } catch (thrown) {
          handleError({ thrown, message, actionType: ConversationActionType.sendRegeneratePrompt });
        }
      })();
    },
    [logConversationEvent, state, withoutErroredMessages, handleError],
  );

  const sendUserPrompt = useCallback(
    ({ userPrompt, examplePromptCategory, promptAssistantResponse }: SendUserPromptProps) => {
      // do not allow sending prompts if the user hasn't opted in
      if (!acceptedOptIn) {
        // After they opt in, call sendUserPrompt again
        processOptIn(() =>
          sendUserPrompt({ userPrompt, examplePromptCategory, promptAssistantResponse }),
        );
        return;
      }

      // do not allow sending prompts when connection is closed
      if (!isConnected) {
        return;
      }

      const message: PromptMessage = {
        content: userPrompt,
        context: {
          requestType: MessageRequestType.UserPrompt,
          prompt: userPrompt,
        },
        requestId: uuidv4(),
        messageId: uuidv4(),
        role: MessageRole.User,
        createTime: new Date().toISOString(),
      };
      // reset 'active' message pair to map to this prompt
      // and move formerly active message prompt+response pair to message
      // history
      const messageHistory = [
        ...state.messageHistory,
        ...(state.activePromptMessage ? [state.activePromptMessage] : []),
        ...(state.activeResponseMessage ? [state.activeResponseMessage] : []),
      ];
      dispatch({
        type: ConversationActionType.sendUserPrompt,
        message,
        messageHistory: withoutErroredMessages(messageHistory),
        prompt: userPrompt,
        originalPrompt: userPrompt,
      });

      (async () => {
        try {
          const conversationId = state.conversationId ?? uuidv4();
          if (!state.conversationId) {
            // if no stored conversationId, this is initiating a new conversation
            dispatch({
              type: ConversationActionType.initiateConversation,
              conversationId,
            });
          }

          const stateContext = {
            ...state,
            messageHistory: withoutErroredMessages(messageHistory),
            activePromptMessage: message,
            conversationId,
          };
          const { conversation } = await promptAssistantResponse(stateContext);

          const activeMessage = conversation.messages[conversation.messages.length - 1];
          // If the server appends an Assistant message to the conversation, we should display it
          if (activeMessage.role === MessageRole.Assistant) {
            dispatch({
              type: ConversationActionType.setActiveResponseMessage,
              messageId: activeMessage.messageId,
              messageContent: activeMessage.content,
              requestId: activeMessage.requestId,
              actions: [],
            });
          }

          logConversationEvent(ConversationLogEvent.UserSubmitPrompt, stateContext, {
            conversation,
          });
        } catch (thrown) {
          handleError({ thrown, message, actionType: ConversationActionType.initiateConversation });
        }
      })();
    },
    [
      acceptedOptIn,
      isConnected,
      logConversationEvent,
      processOptIn,
      state,
      withoutErroredMessages,
      handleError,
    ],
  );

  const actions = useMemo(
    () => ({
      rateResponse,
      stopResponse,
      regenerateResponse,
      sendUserPrompt,
    }),
    [rateResponse, stopResponse, regenerateResponse, sendUserPrompt],
  );

  return useMemo(
    () => ({
      state,
      actions,
    }),
    [state, actions],
  );
};

export default useConversationReducer;
