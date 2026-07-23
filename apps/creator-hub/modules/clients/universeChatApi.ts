import { getBEDEV2ServiceBasePath } from './utils';

const BASE_PATH = getBEDEV2ServiceBasePath('universe-chat-api');
const CSRF_TOKEN_HEADER = 'x-csrf-token';

export type GlobalChatStatus = 'Enabled' | 'Disabled';

export type GetUniverseChatUniverseSettingsResponse = {
  universeId: number;
  globalChatStatus: GlobalChatStatus;
  isEligibleToSeeGlobalChatSetting?: boolean;
};

export type UpdateUniverseChatUniverseSettingsRequest = {
  globalChatStatus?: GlobalChatStatus;
};

async function fetchWithCredentials(
  path: string,
  csrfToken: string | null | undefined,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${BASE_PATH}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };
  if (csrfToken) {
    (headers as Record<string, string>)[CSRF_TOKEN_HEADER] = csrfToken;
  }
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
}

export async function getUniverseChatUniverseSettings(
  universeId: string,
): Promise<GetUniverseChatUniverseSettingsResponse> {
  const response = await fetchWithCredentials(
    `/v1/universe-chat-universe-settings/${universeId}`,
    undefined,
    { method: 'GET' },
  );
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error((errBody as { message?: string })?.message ?? response.statusText),
      {
        response,
        status: response.status,
      },
    );
  }
  return response.json();
}

export async function updateUniverseChatUniverseSettings(
  universeId: string,
  body: UpdateUniverseChatUniverseSettingsRequest,
): Promise<void> {
  const path = `/v1/universe-chat-universe-settings/${universeId}`;
  const init: RequestInit = {
    method: 'POST',
    body: JSON.stringify(body),
  };

  let response = await fetchWithCredentials(path, undefined, init);
  if (response.status === 403) {
    const token = response.headers.get(CSRF_TOKEN_HEADER);
    if (token) {
      response = await fetchWithCredentials(path, token, init);
    }
  }

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error((errBody as { message?: string })?.message ?? response.statusText),
      { response, status: response.status },
    );
  }
}
