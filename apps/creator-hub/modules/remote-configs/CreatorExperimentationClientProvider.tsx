import React from 'react';
import type { ValidExperimentationAPI } from './api/validExperimentationTypes';

const creatorExperimentationClientContext = React.createContext<ValidExperimentationAPI | null>(
  null,
);

export const CreatorExperimentationClientProvider: React.FC<
  React.PropsWithChildren<{ client: ValidExperimentationAPI }>
> = ({ client, children }) => {
  return (
    <creatorExperimentationClientContext.Provider value={client}>
      {children}
    </creatorExperimentationClientContext.Provider>
  );
};

export const useCreatorExperimentationClient = (): ValidExperimentationAPI => {
  const client = React.useContext(creatorExperimentationClientContext);
  if (!client) {
    throw new Error(
      'useCreatorExperimentationClient must be used within a creatorExperimentationClientProvider',
    );
  }
  return client;
};
