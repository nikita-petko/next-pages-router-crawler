import { v4 as uuidv4 } from 'uuid';
import {
  BotMessage,
  MessageRole,
  PromptMessage,
  ConversationError,
  MessageHistoryItem,
  ConnectionState,
  WSNotificationBotMessageClientAction,
  PromptContext,
  FeedbackRating,
  ConversationState,
  MessageRequestType,
  MessageId,
  RequestId,
} from '../types';

export enum ConversationActionType {
  sendUserPrompt = 'sendUserPrompt',
  sendRegeneratePrompt = 'sendRegeneratePrompt',
  initiateConversation = 'initiateConversation',
  setActiveResponseMessage = 'setActiveResponseMessage',
  startStreamingResponse = 'startStreamingResponse',
  updateStreamingResponse = 'updateStreamingResponse',
  finishStreamingResponse = 'finishStreamingResponse',
  stopStreamingResponse = 'stopStreamingResponse',
  errorStreamingResponse = 'errorStreamingResponse',
  connectionReconnecting = 'connectionReconnecting',
  connectionConnected = 'connectionConnected',
  connectionClose = 'connectionClose',
  activeMessageConversationError = 'activeMessageConversationError',
  rateResponse = 'rateResponse',
}

export type SendPromptConversationAction =
  | {
      type: ConversationActionType.sendUserPrompt;
      message: PromptMessage;
      messageHistory: MessageHistoryItem[];
      originalPrompt: string;
      prompt: string;
    }
  | {
      type: ConversationActionType.sendRegeneratePrompt;
      message: MessageHistoryItem;
      messageHistory: MessageHistoryItem[];
      originalPrompt: string;
    };

export type ConversationAction =
  | SendPromptConversationAction
  | {
      type: ConversationActionType.initiateConversation;
      conversationId: string;
    }
  | {
      type: ConversationActionType.setActiveResponseMessage;
      messageId: MessageId;
      messageContent?: string;
      requestId?: string;
      actions: WSNotificationBotMessageClientAction[];
    }
  | {
      type: ConversationActionType.startStreamingResponse;
      messageId: MessageId;
      streamingResponseContent: string;
      requestId: RequestId;
      actions: WSNotificationBotMessageClientAction[];
    }
  | {
      type: ConversationActionType.updateStreamingResponse;
      requestId: RequestId;
      streamingResponseContent: string;
    }
  | {
      type: ConversationActionType.finishStreamingResponse;
    }
  | {
      type: ConversationActionType.stopStreamingResponse;
    }
  | {
      type: ConversationActionType.connectionReconnecting;
    }
  | {
      type: ConversationActionType.connectionConnected;
    }
  | {
      type: ConversationActionType.connectionClose;
    }
  | {
      type: ConversationActionType.rateResponse;
      message: MessageHistoryItem;
      rating: FeedbackRating;
    }
  | {
      type: ConversationActionType.activeMessageConversationError;
      error: ConversationError;
      userDailyRateLimit?: number;
    };

export const conversationInitialState: ConversationState = {
  streaming: false,
  isResponseFailed: false,
  messageHistory: [],
  ratingByRequestId: new Map(),
  errorByMessageHistoryIdx: new Map(),
  conversationId: undefined,
  activeRequestId: undefined,
  activePromptMessage: undefined,
  activeResponseMessage: undefined,
  activeMessageConversationError: undefined,
  userDailyRateLimit: undefined,
  userRateLimitErrorCount: 0,
  connectionState: ConnectionState.Connected,
};

const buildActivePromptState = (
  state: ConversationState,
  action: SendPromptConversationAction,
): ConversationState => {
  const activePromptMessage: PromptMessage = {
    ...action.message,
    context: {
      ...action.message.context,
      requestType:
        action.type === ConversationActionType.sendRegeneratePrompt
          ? MessageRequestType.RegenerationRequest
          : MessageRequestType.UserPrompt,
      prompt: action.type === ConversationActionType.sendUserPrompt ? action.prompt : '',
      originalPrompt:
        action.type === ConversationActionType.sendRegeneratePrompt ? action.originalPrompt : '',
    } as PromptContext,
    role: MessageRole.User as MessageRole.User,
    createTime: new Date().toISOString(),
  };

  // Validate that the previous active messages have been moved to the message history
  // (if this isn't the first message in the conversation)

  // messageHistory is all the messages BEFORE the current active one,
  // so when sending a new message, the current active one should be pushed to history
  // and this new one goes into active. Therefore, the first message of a conversation
  // would have no conversationId, no active messages, and no message history.
  // The second message would have a conversationId, an active message, but still no message history.
  // The third message would have a conversationId, an active message, and a message history.

  if (state.conversationId) {
    const lengthDiff = action.messageHistory.length - state.messageHistory.length;
    const expectedLengthDiff =
      (state.activePromptMessage ? 1 : 0) + (state.activeResponseMessage ? 1 : 0);
    if (lengthDiff !== expectedLengthDiff) {
      // The new history isn't longer than the old history, which means
      // we didn't add the previous active messages to the history
      throw new Error(
        `Expected message history to be ${expectedLengthDiff} messages longer, but was ${lengthDiff} messages longer`,
      );
    }
  }

  return {
    ...state,
    messageHistory: action.messageHistory,
    activePromptMessage,
    activeRequestId: action.message.requestId,
    activeResponseMessage: undefined, // This new prompt doesn't have a response yet
    activeMessageConversationError: undefined, // clear it on eagerly displaying prompt.
    // activeMessageConversationError will populate later if sent prompt request
    // errors
    streaming: true, // Add UI indicator that a response is being streamed in
  };
};

const getEndStreamingHandlingState = (state: ConversationState) => {
  return {
    ...state,
    streaming: false,
    activeMessageId: undefined,
    // stops handling streaming message related events
    // when {activeMessageId} is undefined via {matchesActiveMessage}

    // spec: Y scroll position should remain at bottom when streaming ends
    // don't dislocate activeResponseMessage UI
    // moving it to messageHistory would temporarily change scrollY, so don't do that
  };
};

const createActiveResponseMessage = (
  state: ConversationState,
  messageId: MessageId,
  messageContent?: string,
  requestId?: string,
  actions: WSNotificationBotMessageClientAction[] = [],
): BotMessage => {
  if (!state.activePromptMessage) throw new Error(`state.activePromptMessage is required`);
  return {
    messageId,
    createTime: new Date().toISOString(),
    role: MessageRole.Assistant,
    content: messageContent ?? '',
    requestId: requestId ?? '',
    context: {
      requestType: state.activePromptMessage.context.requestType,
      prompt: state.activePromptMessage.context.prompt,
      originalPrompt: state.activePromptMessage.context.originalPrompt,
    } as PromptContext,
    actions,
  };
};

const conversationReducer = (
  state: ConversationState,
  action: ConversationAction,
): ConversationState => {
  const { type } = action;
  switch (type) {
    case ConversationActionType.initiateConversation: {
      return {
        ...state,
        conversationId: action.conversationId,
      };
    }
    case ConversationActionType.setActiveResponseMessage: {
      return {
        ...state,
        streaming: false,
        activeResponseMessage: createActiveResponseMessage(
          state,
          action.messageId,
          action.messageContent,
          action.requestId,
          action.actions,
        ),
        activeRequestId: action.requestId,
      };
    }
    case ConversationActionType.sendRegeneratePrompt:
    case ConversationActionType.sendUserPrompt: {
      return buildActivePromptState(state, action);
    }
    case ConversationActionType.startStreamingResponse: {
      if (!state.activePromptMessage) throw new Error(`state.activePromptMessage is required`);
      return {
        ...state,
        streaming: true,
        activeResponseMessage: createActiveResponseMessage(
          state,
          action.messageId,
          action.streamingResponseContent,
          action.requestId,
          action.actions,
        ),
        activeRequestId: action.requestId,
      };
    }
    case ConversationActionType.updateStreamingResponse: {
      // note: the streamed notifications can come out of order (an 'update' can
      // occur before a 'start'), so create the active response message if needed
      const activeResponseMessage =
        state.activeResponseMessage ||
        createActiveResponseMessage(state, uuidv4(), '', action.requestId);
      return {
        ...state,
        activeRequestId: activeResponseMessage.requestId,
        streaming: true,
        activeResponseMessage: {
          ...activeResponseMessage,
          content: (activeResponseMessage.content || '') + action.streamingResponseContent,
        },
      };
    }
    case ConversationActionType.finishStreamingResponse: {
      if (!state.activeResponseMessage) throw new Error(`state.activeResponseMessage required`);
      return {
        ...state,
        streaming: false,
      };
    }
    case ConversationActionType.stopStreamingResponse: {
      return getEndStreamingHandlingState(state);
    }
    case ConversationActionType.rateResponse: {
      if (!action.message.requestId)
        throw new Error(`Tried to rate a response but no request ID found`);
      const { ratingByRequestId } = state;
      const ratingByRequestIdNew = structuredClone(ratingByRequestId);
      ratingByRequestIdNew.set(action.message.requestId, action.rating);
      return {
        ...state,
        ratingByRequestId: ratingByRequestIdNew,
      };
    }
    case ConversationActionType.connectionReconnecting: {
      return { ...state, connectionState: ConnectionState.Reconnecting };
    }
    case ConversationActionType.connectionConnected: {
      return { ...state, connectionState: ConnectionState.Connected };
    }
    case ConversationActionType.connectionClose: {
      return {
        ...getEndStreamingHandlingState(state),
        connectionState: ConnectionState.Closed,
      };
    }
    case ConversationActionType.activeMessageConversationError: {
      const { errorByMessageHistoryIdx, userRateLimitErrorCount } = state;
      const errorByMessageHistoryIdxNew = structuredClone(errorByMessageHistoryIdx);
      let userRateLimitErrorCountNew = userRateLimitErrorCount;

      // conversation error occurred on activePromptMessage, which
      // will have index state.messageHistory.length once appended
      // to messageHistory (on new prompt sent)
      const errorMessageIdx = state.messageHistory.length;

      // display only the first error message sent, ignoring others if any
      if (!errorByMessageHistoryIdxNew.get(errorMessageIdx)) {
        errorByMessageHistoryIdxNew.set(errorMessageIdx, action.error);
      }

      // easter egg count
      if (action.error === 'UserRateLimitExceeded') userRateLimitErrorCountNew += 1;

      return {
        ...state,
        activeMessageConversationError: action.error,
        userDailyRateLimit: action.userDailyRateLimit,
        errorByMessageHistoryIdx: errorByMessageHistoryIdxNew,
        streaming: false,
        userRateLimitErrorCount: userRateLimitErrorCountNew,
      };
    }
    default: {
      throw new Error(`Unhandled conversation action ${type}`);
    }
  }
};

export default conversationReducer;
