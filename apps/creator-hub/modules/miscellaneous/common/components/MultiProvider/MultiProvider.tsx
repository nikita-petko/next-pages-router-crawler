import React, { ReactElement, ReactNode, type JSX } from 'react';

export type MultiProviderProps = {
  providers: ReactElement[];
  children: ReactNode;
};

const MultiProvider = ({ providers, children }: MultiProviderProps): JSX.Element => {
  let accumulated = children;

  for (let i = providers.length - 1; i >= 0; i -= 1) {
    accumulated = React.cloneElement(providers[i], {}, accumulated);
  }

  return <React.Fragment>{accumulated}</React.Fragment>;
};
export default MultiProvider;
