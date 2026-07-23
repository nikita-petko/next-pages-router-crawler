import { createContext, useContext } from 'react';

export interface ServerTypeContextValue {
  serverType: string | undefined;
  setServerType: (type: string) => void;
}

export const ServerTypeContext = createContext<ServerTypeContextValue>({
  serverType: undefined,
  setServerType: () => {},
});

export const useServerType = () => useContext(ServerTypeContext);
