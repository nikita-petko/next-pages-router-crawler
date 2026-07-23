import type { ReactElement, ReactNode } from 'react';
import React, { type JSX } from 'react';

export type MultiProviderProps = {
  providers: ReactElement[];
  children: ReactNode;
};

const MultiProvider = ({ providers, children }: MultiProviderProps): JSX.Element => {
  let accumulated = children;

  for (let i = providers.length - 1; i >= 0; i -= 1) {
    accumulated = React.cloneElement(providers[i], {}, accumulated);
  }

  return <>{accumulated}</>;
};
export default MultiProvider;
