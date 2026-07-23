import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';

const MATCHMAKING_API_BASE_PATH = getBEDEV2ServiceBasePath('matchmaking-api');
const SHUTDOWN_GAME_INSTANCE_URL = `${MATCHMAKING_API_BASE_PATH}/v1/game-instances/shutdown`;
const CSRF_TOKEN_HEADER = 'x-csrf-token';

export interface ShutdownGameInstanceParams {
  placeId: number;
  gameId: string;
  privateServerId?: string;
}

export async function shutdownGameInstance(placeId: number, gameId: string): Promise<Response> {
  const body: ShutdownGameInstanceParams = { placeId, gameId };

  const doPost = (csrfToken: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (csrfToken) {
      headers[CSRF_TOKEN_HEADER] = csrfToken;
    }
    return fetch(SHUTDOWN_GAME_INSTANCE_URL, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(body),
    });
  };

  const response = await doPost(null);
  if (response.status === 403) {
    const token = response.headers.get(CSRF_TOKEN_HEADER);
    if (token) {
      return doPost(token);
    }
  }
  return response;
}

export function joinGameInstance(gameInstanceId: string, placeId: number): void {
  window.location.href = `roblox://experiences/start?placeId=${placeId}&gameInstanceId=${gameInstanceId}`;
}
