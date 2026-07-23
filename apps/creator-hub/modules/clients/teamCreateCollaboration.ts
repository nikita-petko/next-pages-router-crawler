import { getBEDEV2ServiceBasePath } from './utils';

const basePath = getBEDEV2ServiceBasePath('team-create-service');
const CSRF_TOKEN_HEADER = 'x-csrf-token';

export interface TrustedConnectionEntry {
  UserId: number;
  ErrorReason: string;
}

interface CanCollaborateResponse {
  CanCollaborate: boolean;
  Error: string;
  UserId: number;
  UniverseId: number;
  RequiresTrustedConnection: TrustedConnectionEntry[];
}

interface MultiUniverseGetCanCollaborateResponse {
  Responses: CanCollaborateResponse[];
}

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

interface GetCanCollaborateResponse {
  CanCollaborate: boolean;
  Error: string;
  UserId: number;
  UniverseId: number;
  RequiresTrustedConnection: TrustedConnectionEntry[];
}

export async function getCanCollaborate(universeId: number): Promise<TrustedConnectionEntry[]> {
  const response = await fetchWithCsrf(`${basePath}/v1/GetCanCollaborate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ UniverseId: universeId }),
  });

  if (!response.ok) {
    throw new Error(`GetCanCollaborate failed with status ${response.status}`);
  }

  const json: GetCanCollaborateResponse = await response.json();
  return json.RequiresTrustedConnection ?? [];
}

export default async function multiUniverseGetCanCollaborate(
  universeIds: number[],
): Promise<Record<number, boolean>> {
  const response = await fetchWithCsrf(`${basePath}/v1/MultiUniverseGetCanCollaborate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ universeIds }),
  });

  if (!response.ok) {
    throw new Error(`MultiUniverseGetCanCollaborate failed with status ${response.status}`);
  }

  const json: MultiUniverseGetCanCollaborateResponse = await response.json();

  const result: Record<number, boolean> = {};
  json.Responses.forEach((entry) => {
    result[entry.UniverseId] = !entry.CanCollaborate || entry.Error === 'NotAuthorized';
  });
  return result;
}
