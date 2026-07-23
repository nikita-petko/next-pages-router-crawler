import {
  Configuration,
  ConversationsApi,
  ConversationsCreateConversationRequest,
  ConversationsSendMessageRequest,
  ConversationsCancelMessageRequest,
  CreateConversationResponse,
  ListConversationItemsResponse,
  ConversationItem,
  Order,
  type ContentPart,
} from '@rbx/client-analytics-assistant-api/v2';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';

const basePath = getBEDEV2ServiceBasePath('analytics-assistant');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const conversationsApi = new ConversationsApi(configuration);

export type {
  CreateConversationResponse,
  ListConversationItemsResponse,
  ConversationItem,
  ContentPart,
};

export { Order as ConversationOrder };

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
  }) as Promise<object>;
};

export const listConversationItems = async (
  conversationId: string,
  universeId: number,
  options?: {
    limit?: number;
    pageToken?: string;
    order?: Order;
  },
): Promise<ListConversationItemsResponse> => {
  return conversationsApi.conversationsListConversationItems({
    conversationId,
    universeId,
    limit: options?.limit,
    pageToken: options?.pageToken,
    order: options?.order,
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
  }) as Promise<object>;
};
