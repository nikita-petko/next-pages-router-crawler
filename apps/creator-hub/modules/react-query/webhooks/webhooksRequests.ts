import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  WebhookConfiguration,
  WebhookConfigurationApi,
  WebhookConfigurationGetWebhookConfigurationsByUserIdRequest,
} from '@rbx/clients/webhookConfigurationGateway';

const basePath = getBEDEV2ServiceBasePath('webhook-configuration');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

export const webhookConfigurationApi = new WebhookConfigurationApi(configuration);

export type Webhook = {
  id: string;
} & WebhookConfiguration;

export const fetchWebhooks = async (
  payload: WebhookConfigurationGetWebhookConfigurationsByUserIdRequest,
): Promise<Array<Webhook>> => {
  return (
    await webhookConfigurationApi.webhookConfigurationGetWebhookConfigurationsByUserId(payload)
  ).webhookConfigurations?.map((webhookConfigurationResponse) => {
    return {
      ...webhookConfigurationResponse.webhookConfiguration,
      id: webhookConfigurationResponse.webhookConfigurationId,
    };
  });
};

export const deleteWebhook = async (webhookConfigurationId: string) => {
  return webhookConfigurationApi.webhookConfigurationDeleteWebhookConfiguration({
    webhookConfigurationId,
  });
};

export const createWebhook = async ({
  userId,
  webhookConfiguration,
}: {
  userId: number;
  webhookConfiguration: WebhookConfiguration;
}): Promise<Webhook> => {
  const response =
    await webhookConfigurationApi.webhookConfigurationCreateWebhookConfigurationForUser({
      userId,
      webhookConfigurationCreateWebhookConfigurationForUserRequest: {
        webhookConfiguration,
      },
    });
  return {
    ...response.webhookConfiguration,
    id: response.webhookConfigurationId,
  };
};

export const updateWebhook = async ({
  webhookId,
  webhookConfiguration,
}: {
  webhookId: string;
  webhookConfiguration: WebhookConfiguration;
}): Promise<Webhook> => {
  const response = await webhookConfigurationApi.webhookConfigurationUpdateWebhookConfiguration({
    webhookConfigurationId: webhookId,
    webhookConfigurationUpdateWebhookConfigurationRequest: { webhookConfiguration },
  });

  return {
    ...response.webhookConfiguration,
    id: response.webhookConfigurationId,
  };
};

export const triggerWebhook = async (webhookConfiguration: WebhookConfiguration) => {
  return webhookConfigurationApi.webhookConfigurationTriggerWebhookEvent({
    webhookConfigurationTriggerWebhookEventRequest: { webhookConfiguration },
  });
};

export type TriggerWebhook = typeof triggerWebhook;
export type DeleteWebhook = typeof deleteWebhook;
export type UpdateWebhook = typeof updateWebhook;
export type CreateWebhook = typeof createWebhook;
