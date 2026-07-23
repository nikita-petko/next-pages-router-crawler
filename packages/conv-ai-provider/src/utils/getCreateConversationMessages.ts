import {
  BotMessageAction,
  Conversation,
  isBotMessage,
  isBotMessageClientAction,
  MessageHistoryItem,
} from '../types';
import getConvApiBotMessageClientAction from './getConvApiBotMessageClientAction';

/**
 *
 * @param messages messages from ConversationReducer
 * @returns list of messages for createConversation message history context
 */
const getCreateConversationMessages = (
  messages: MessageHistoryItem[],
): Conversation['messages'] => {
  return messages.map((message: MessageHistoryItem) => {
    const createConvMessage: Conversation['messages'] = {
      ...message,
      // remove duplicated/unneeded fields,
      createdTime: undefined,
      context: undefined,
    };
    if (isBotMessage(message) && message.actions) {
      delete createConvMessage.content;
      createConvMessage.actions = message.actions.map((action: BotMessageAction) => {
        if (isBotMessageClientAction(action)) {
          return getConvApiBotMessageClientAction(action, message.content);
        }
        return action;
      });
    }
    return createConvMessage;
  });
};

export default getCreateConversationMessages;
