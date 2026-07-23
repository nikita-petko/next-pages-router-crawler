import type {
  ConversationsCreateConversationRequest,
  ConversationsSendMessageRequest,
  ConversationsCancelMessageRequest,
  CreateConversationResponse,
  GetConversationResponse,
  ConversationPermissions,
  ListConversationItemsResponse,
  ConversationItem,
  GetConversationStreamResponse,
  StreamNotificationEnvelope,
} from '@rbx/client-analytics-assistant-api/v2';
import {
  ConversationsApi,
  MessageStatus,
  Order,
  type ContentPart,
} from '@rbx/client-analytics-assistant-api/v2';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

const configuration = createClientConfiguration('analytics-assistant', 'bedev2');

const conversationsApi = new ConversationsApi(configuration);

export type {
  CreateConversationResponse,
  GetConversationResponse,
  ConversationPermissions,
  ListConversationItemsResponse,
  ConversationItem,
  ContentPart,
  GetConversationStreamResponse,
  StreamNotificationEnvelope,
};

export { Order as ConversationOrder, MessageStatus };

/** Page size for each list-items request while paginating full conversation history. */
const DEFAULT_CONVERSATION_ITEMS_PAGE_SIZE = 100;

export const createConversation = async (
  universeId: number,
): Promise<CreateConversationResponse> => {
  const request: ConversationsCreateConversationRequest = {
    universeId,
  };

  return conversationsApi.conversationsCreateConversation({
    conversationsCreateConversationRequest: request,
  });
};

export const sendMessage = async (
  conversationId: string,
  universeId: number,
  input: string,
): Promise<object> => {
  const request: ConversationsSendMessageRequest = {
    universeId,
    input,
  };

  return conversationsApi.conversationsSendMessage({
    conversationId,
    conversationsSendMessageRequest: request,
  });
};

export const getConversation = async (conversationId: string): Promise<GetConversationResponse> =>
  conversationsApi.conversationsGetConversation({ conversationId });

export const listConversationItems = async (
  conversationId: string,
  options?: {
    limit?: number;
    pageToken?: string;
    order?: Order;
  },
): Promise<ListConversationItemsResponse> => {
  return conversationsApi.conversationsListConversationItems({
    conversationId,
    limit: options?.limit,
    pageToken: options?.pageToken,
    order: options?.order,
  });
};

export interface ListAllConversationItemsOptions {
  order?: Order;
  pageSize?: number;
}

export const listAllConversationItems = async (
  conversationId: string,
  options?: ListAllConversationItemsOptions,
): Promise<ConversationItem[]> => {
  const order = options?.order ?? Order.Ascending;
  const pageSize = options?.pageSize ?? DEFAULT_CONVERSATION_ITEMS_PAGE_SIZE;
  const items: ConversationItem[] = [];
  let pageToken: string | undefined;

  while (true) {
    const response = await listConversationItems(conversationId, {
      limit: pageSize,
      pageToken,
      order,
    });

    items.push(...(response.data ?? []));

    if (!response.hasMore || response.nextPageToken == null) {
      break;
    }

    pageToken = response.nextPageToken;
  }

  return items;
};

export const getConversationStream = async (
  conversationId: string,
  messageId: string,
  after?: number,
): Promise<GetConversationStreamResponse> => {
  return conversationsApi.conversationsGetConversationStream({
    conversationId,
    messageId,
    after,
  });
};

export const cancelMessage = async (
  conversationId: string,
  universeId: number,
): Promise<object> => {
  const request: ConversationsCancelMessageRequest = {
    universeId,
  };

  return conversationsApi.conversationsCancelMessage({
    conversationId,
    conversationsCancelMessageRequest: request,
  });
};
