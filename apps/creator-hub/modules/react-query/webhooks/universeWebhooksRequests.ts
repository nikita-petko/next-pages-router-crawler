import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import { WebhookConfiguration } from '@rbx/clients/webhookConfigurationGateway';
import type { Webhook } from './webhooksRequests';

const basePath = getBEDEV2ServiceBasePath('webhook-configuration');

export const fetchUniverseWebhooks = async ({
  universeId,
}: {
  universeId: number;
}): Promise<Webhook[]> => {
  const response = await fetch(`${basePath}/v1/universes/${universeId}/webhooks`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw response;
  }

  const data = await response.json();
  return (data.webhookConfigurations ?? []).map(
    (webhookConfigurationResponse: {
      webhookConfiguration: WebhookConfiguration;
      webhookConfigurationId: string;
    }) => ({
      ...webhookConfigurationResponse.webhookConfiguration,
      id: webhookConfigurationResponse.webhookConfigurationId,
    }),
  );
};

const CSRF_TOKEN_HEADER = 'x-csrf-token';

async function fetchWithCsrf(url: string, options: RequestInit): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 403) {
    const csrfToken = response.headers.get(CSRF_TOKEN_HEADER);
    if (csrfToken) {
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set(CSRF_TOKEN_HEADER, csrfToken);
      return fetch(url, { ...options, headers: retryHeaders });
    }
  }

  return response;
}

export const createUniverseWebhook = async ({
  universeId,
  webhookConfiguration,
}: {
  universeId: number;
  webhookConfiguration: WebhookConfiguration;
}): Promise<Webhook> => {
  const response = await fetchWithCsrf(`${basePath}/v1/universes/${universeId}/webhooks`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhookConfiguration }),
  });

  if (!response.ok) {
    throw response;
  }

  const data = await response.json();
  return {
    ...data.webhookConfiguration,
    id: data.webhookConfigurationId,
  };
};

export const updateUniverseWebhook = async ({
  webhookId,
  webhookConfiguration,
}: {
  webhookId: string;
  webhookConfiguration: WebhookConfiguration;
}): Promise<Webhook> => {
  const response = await fetchWithCsrf(`${basePath}/v1/webhooks/${webhookId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhookConfiguration }),
  });

  if (!response.ok) {
    throw response;
  }

  const data = await response.json();
  return {
    ...data.webhookConfiguration,
    id: data.webhookConfigurationId,
  };
};

export const deleteUniverseWebhook = async (webhookConfigurationId: string): Promise<void> => {
  const response = await fetchWithCsrf(`${basePath}/v1/webhooks/${webhookConfigurationId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw response;
  }
};
