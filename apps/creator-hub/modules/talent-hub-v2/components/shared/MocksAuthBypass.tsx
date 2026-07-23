import React from 'react';
import Authenticated from '@modules/authentication/Authenticated';
import { isLocalTh2DevModeEnabled } from '../../utils';

/**
 * Local fallback mode: when `?mocks=1&local=1`, skip the Authenticated wrapper
 * entirely. This lets TH2 be exercised while ST auth services are down.
 *
 * Normal authenticated behavior remains unchanged unless local mode is enabled.
 */
export const MocksAuthBypass: React.FC<React.PropsWithChildren> = ({ children }) => {
  if (isLocalTh2DevModeEnabled()) {
    return <>{children}</>;
  }
  return <Authenticated>{children}</Authenticated>;
};

export default MocksAuthBypass;
