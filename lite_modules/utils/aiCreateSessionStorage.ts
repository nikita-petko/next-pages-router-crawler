import { LocalStorage } from 'ttl-localstorage';

import { type AiCreateSessionSnapshot } from '@stores/aiCreateSessionStoreProvider';
import { InBrowser } from '@utils/browser';
import { CaptureException } from '@utils/error';

const AI_CREATE_LIBRARY_SESSION_TTL_SECONDS = 86400; // 24 hours

const getStorageKey = (adAccountId: string, universeId: number): string =>
  `aiCreateLibrarySession:${adAccountId}:${universeId}`;

export const getPersistedLibrarySession = (
  adAccountId: string | undefined,
  universeId: number | undefined,
): AiCreateSessionSnapshot | null => {
  if (!InBrowser() || !adAccountId || !universeId) {
    return null;
  }
  try {
    return (
      (LocalStorage.get(getStorageKey(adAccountId, universeId)) as AiCreateSessionSnapshot) ?? null
    );
  } catch (error) {
    CaptureException(error, { context: 'getPersistedLibrarySession' });
    return null;
  }
};

export const setPersistedLibrarySession = (session: AiCreateSessionSnapshot): void => {
  if (!InBrowser() || !session.adAccountId || !session.universeId) {
    return;
  }
  try {
    LocalStorage.put(
      getStorageKey(session.adAccountId, session.universeId),
      session,
      AI_CREATE_LIBRARY_SESSION_TTL_SECONDS,
    );
  } catch (error) {
    CaptureException(error, { context: 'setPersistedLibrarySession' });
  }
};

export const clearPersistedLibrarySession = (
  adAccountId: string | undefined,
  universeId: number | undefined,
): void => {
  if (!InBrowser() || !adAccountId || !universeId) {
    return;
  }
  try {
    LocalStorage.removeKey(getStorageKey(adAccountId, universeId));
  } catch (error) {
    CaptureException(error, { context: 'clearPersistedLibrarySession' });
  }
};
