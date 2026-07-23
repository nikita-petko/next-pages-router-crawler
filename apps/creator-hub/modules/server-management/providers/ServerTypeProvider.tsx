import type { FunctionComponent, PropsWithChildren } from 'react';
import React, { useMemo, useState } from 'react';
import { ServerTypeContext } from './ServerTypeContext';

const ServerTypeProvider: FunctionComponent<PropsWithChildren<object>> = ({ children }) => {
  const [serverType, setServerType] = useState<string | undefined>(undefined);

  const value = useMemo(() => ({ serverType, setServerType }), [serverType]);

  return <ServerTypeContext.Provider value={value}>{children}</ServerTypeContext.Provider>;
};

export default ServerTypeProvider;
