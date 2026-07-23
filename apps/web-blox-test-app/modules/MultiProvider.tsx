import React, { JSX, type ReactElement, type ReactNode } from 'react';

export type TMultiProviderProps = {
  providers: ReactElement[];
  children: ReactNode;
};

const MultiProvider = ({ providers, children }: TMultiProviderProps): JSX.Element => {
  let accumulated = children;

  for (let i = providers.length - 1; i >= 0; i -= 1) {
    accumulated = React.cloneElement(providers[i], {}, accumulated);
  }

  return <>{accumulated}</>;
};

export default MultiProvider;
