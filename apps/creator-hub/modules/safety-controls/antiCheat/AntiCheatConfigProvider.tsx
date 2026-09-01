import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { ConfaasAntiCheatConfigClient } from './antiCheatConfig.confaas';
import type { AntiCheatConfigClient } from './antiCheatConfig.types';

const AntiCheatConfigClientContext = createContext<AntiCheatConfigClient | null>(null);

type AntiCheatConfigProviderProps = PropsWithChildren<{
  /** Experience whose anti-cheat config repository is read/written. Required unless `client` is set. */
  universeId?: number;
  /** Overrides the default CONFaaS-backed client (tests and Storybook inject a mock here). */
  client?: AntiCheatConfigClient;
}>;

export const AntiCheatConfigProvider: FC<AntiCheatConfigProviderProps> = ({
  children,
  universeId,
  client,
}) => {
  const resolvedClient = useMemo<AntiCheatConfigClient>(() => {
    if (client) {
      return client;
    }
    if (universeId === undefined) {
      throw new Error('AntiCheatConfigProvider requires a universeId when no client is provided');
    }
    return new ConfaasAntiCheatConfigClient(universeId.toString());
  }, [client, universeId]);

  return (
    <AntiCheatConfigClientContext.Provider value={resolvedClient}>
      {children}
    </AntiCheatConfigClientContext.Provider>
  );
};

export const useAntiCheatConfigClient = (): AntiCheatConfigClient => {
  const client = useContext(AntiCheatConfigClientContext);
  if (client === null) {
    throw new Error('useAntiCheatConfigClient must be used within an AntiCheatConfigProvider');
  }
  return client;
};
