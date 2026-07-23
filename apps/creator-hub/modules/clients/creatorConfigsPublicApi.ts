export type CreatorConfigsPublicApiRepository =
  | 'InExperienceConfig'
  | 'RecommendationServicesConfig';
export type CreatorConfigsPublicApiDeploymentStrategy = 'GradualRollout' | 'Immediate';

export type CreatorConfigsPublicApiConfigValueFull = {
  value: unknown | null;
  description?: string | null;
  lastModifiedTime: string;
  lastAccessedTime: string;
};

export type CreatorConfigsPublicApiConfigRepositoryFull = {
  entries?: Record<string, CreatorConfigsPublicApiConfigValueFull> | null;
  metadata?: { configVersion: number } | null;
};

export type CreatorConfigsPublicApiConfigRepositoryValues = {
  entries?: Record<string, unknown | null> | null;
  metadata?: { configVersion: number } | null;
};

export type CreatorConfigsPublicApiUpdateDraftRequest = {
  draftHash?: string | null;
  entries?: Record<string, unknown | null> | null;
};

export type CreatorConfigsPublicApiDraftHashResponse = {
  draftHash?: string | null;
};

export type CreatorConfigsPublicApiPublishDraftRequest = {
  draftHash?: string | null;
  message?: string | null;
  deploymentStrategy: CreatorConfigsPublicApiDeploymentStrategy;
};

export type CreatorConfigsPublicApiPublishDraftResponse = {
  configVersion: number;
};

export type CreatorConfigsPublicApiRequestOptions = {
  universeId: string;
  repository: CreatorConfigsPublicApiRepository;
};

export class CreatorConfigsPublicApiHttpError extends Error {
  status: number;

  bodyText: string;

  constructor(args: { status: number; bodyText: string; message?: string }) {
    super(args.message ?? `creator-configs-public-api request failed (${args.status})`);
    this.name = 'CreatorConfigsPublicApiHttpError';
    this.status = args.status;
    this.bodyText = args.bodyText;
    // Ensure instanceof works reliably across TS targets.
    Object.setPrototypeOf(this, CreatorConfigsPublicApiHttpError.prototype);
  }
}

function getCreatorConfigsPublicApiBaseUrl(): string {
  const bedev2BaseUrl = process.env.bedev2BaseUrl ?? 'https://apis.sitetest3.robloxlabs.com';
  return `${bedev2BaseUrl}/creator-configs-public-api`;
}

let csrfToken: string | null = null;

async function request(relativePath: string, options: RequestInit & { signal?: AbortSignal } = {}) {
  const url = `${getCreatorConfigsPublicApiBaseUrl()}${relativePath}`;
  const attemptFetch = async (useCsrf: boolean): Promise<Response> => {
    const headers = new Headers(options.headers ?? {});
    headers.set('Accept', 'application/json');
    if (options.body != null && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (useCsrf && csrfToken) {
      headers.set('x-csrf-token', csrfToken);
    }

    return fetch(url, {
      credentials: 'include',
      ...options,
      headers,
    });
  };

  let response = await attemptFetch(true);
  if (response.status === 403) {
    const newCsrfToken = response.headers.get('x-csrf-token');
    if (newCsrfToken) {
      csrfToken = newCsrfToken;
      response = await attemptFetch(true);
    } else if (csrfToken) {
      // Token can go stale (login/session change). Clear and retry once without a token
      // to trigger a fresh token response.
      csrfToken = null;
      response = await attemptFetch(false);
      const retryToken = response.headers.get('x-csrf-token');
      if (response.status === 403 && retryToken) {
        csrfToken = retryToken;
        response = await attemptFetch(true);
      }
    }
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new CreatorConfigsPublicApiHttpError({
      status: response.status,
      bodyText: text,
      message: `creator-configs-public-api request failed (${response.status}): ${text}`,
    });
  }

  return response;
}

async function requestJson<TResponse>(
  relativePath: string,
  options: RequestInit & { signal?: AbortSignal } = {},
): Promise<TResponse> {
  const response = await request(relativePath, options);
  return (await response.json()) as TResponse;
}

async function requestNoResponseBody(
  relativePath: string,
  options: RequestInit & { signal?: AbortSignal } = {},
): Promise<void> {
  await request(relativePath, options);
}

export async function getConfigRepositoryFull({
  universeId,
  repository,
}: CreatorConfigsPublicApiRequestOptions): Promise<CreatorConfigsPublicApiConfigRepositoryFull> {
  try {
    return await requestJson<CreatorConfigsPublicApiConfigRepositoryFull>(
      `/v1/configs/universes/${encodeURIComponent(universeId)}/repositories/${encodeURIComponent(
        repository,
      )}/full`,
      { method: 'GET' },
    );
  } catch (e: unknown) {
    // A 404 means this universe has not created any configs yet.
    // Treat it as an empty repository so callers can render their empty states.
    if (e instanceof CreatorConfigsPublicApiHttpError && e.status === 404) {
      return { entries: null, metadata: null };
    }
    throw e;
  }
}

export async function getConfigRepositoryValues({
  universeId,
  repository,
}: CreatorConfigsPublicApiRequestOptions): Promise<CreatorConfigsPublicApiConfigRepositoryValues> {
  try {
    return await requestJson<CreatorConfigsPublicApiConfigRepositoryValues>(
      `/v1/configs/universes/${encodeURIComponent(universeId)}/repositories/${encodeURIComponent(
        repository,
      )}`,
      { method: 'GET' },
    );
  } catch (e: unknown) {
    // A 404 means this universe has not created any configs yet.
    // Treat it as an empty repository so callers can proceed.
    if (e instanceof CreatorConfigsPublicApiHttpError && e.status === 404) {
      return { entries: null, metadata: null };
    }
    throw e;
  }
}

export async function updateDraft(
  { universeId, repository }: CreatorConfigsPublicApiRequestOptions,
  body: CreatorConfigsPublicApiUpdateDraftRequest,
): Promise<CreatorConfigsPublicApiDraftHashResponse> {
  return requestJson<CreatorConfigsPublicApiDraftHashResponse>(
    `/v1/configs/universes/${encodeURIComponent(universeId)}/repositories/${encodeURIComponent(
      repository,
    )}/draft`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
}

export async function overwriteDraft(
  { universeId, repository }: CreatorConfigsPublicApiRequestOptions,
  body: CreatorConfigsPublicApiUpdateDraftRequest,
): Promise<CreatorConfigsPublicApiDraftHashResponse> {
  return requestJson<CreatorConfigsPublicApiDraftHashResponse>(
    `/v1/configs/universes/${encodeURIComponent(universeId)}/repositories/${encodeURIComponent(
      repository,
    )}/draft:overwrite`,
    { method: 'PUT', body: JSON.stringify(body) },
  );
}

export async function publishDraft(
  { universeId, repository }: CreatorConfigsPublicApiRequestOptions,
  body: CreatorConfigsPublicApiPublishDraftRequest,
): Promise<CreatorConfigsPublicApiPublishDraftResponse> {
  return requestJson<CreatorConfigsPublicApiPublishDraftResponse>(
    `/v1/configs/universes/${encodeURIComponent(universeId)}/repositories/${encodeURIComponent(
      repository,
    )}/publish`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export async function deleteConfigEntry({
  universeId,
  repository,
  key,
}: CreatorConfigsPublicApiRequestOptions & { key: string }): Promise<void> {
  return requestNoResponseBody(
    `/v1/configs/universes/${encodeURIComponent(universeId)}/repositories/${encodeURIComponent(
      repository,
    )}/entries/${encodeURIComponent(key)}`,
    { method: 'DELETE' },
  );
}
