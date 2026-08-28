import { useMutation } from '@tanstack/react-query';
import type { NotificationButtonHttpRequest } from '@rbx/client-creator-notification-streams-api/v1';
import { createFetchClient } from '@rbx/clients-core';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;
type THttpMethod = (typeof HTTP_METHODS)[number];
const isHttpMethod = (value: string): value is THttpMethod =>
  (HTTP_METHODS as readonly string[]).includes(value);

type TDynamicPaths = Record<
  string, // URL is a string
  Record<THttpMethod, { requestBody?: { content: { 'application/json': BodyInit } } }>
>;

const DEFAULT_REQUEST_TIMEOUT_MS = 5000;

const fetchClient = createFetchClient<TDynamicPaths>({});

const sendNotificationCtaHttpRequest = async (
  httpRequest: NotificationButtonHttpRequest,
  timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<void> => {
  const method = httpRequest.method.toLowerCase();
  if (!isHttpMethod(method)) {
    throw new Error(`Unsupported notification CTA HTTP method: ${httpRequest.method}`);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { response } = await fetchClient.request(method, httpRequest.url, {
      credentials: 'include',
      headers: httpRequest.headers ?? undefined,
      body: httpRequest.body ?? undefined,
      bodySerializer: (body) => body, // default bodySerializer calls JSON.stringify, but body is already string
      parseAs: 'stream', // response body is unused; skip JSON parsing
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Notification CTA request failed with status ${response.status}`);
    }
  } finally {
    clearTimeout(timeoutId);
  }
};

type TSendNotificationCtaRequestVariables = {
  httpRequest: NotificationButtonHttpRequest;
  timeoutMs?: number;
};

const useSendNotificationCtaRequest = () =>
  useMutation({
    onError: (err) => console.error('Notification button click error', err),
    mutationFn: ({ httpRequest, timeoutMs }: TSendNotificationCtaRequestVariables) =>
      sendNotificationCtaHttpRequest(httpRequest, timeoutMs),
  });

export default useSendNotificationCtaRequest;
