import { createContext, FC, useContext } from 'react';
import * as React from 'react';

import experienceSubscriptionsClient, {
  ExperienceSubscriptionsApiClient,
} from '@modules/clients/experienceSubscriptions';

type ExperienceSubscriptionsClientProviderState = {
  experienceSubscriptionsClient: ExperienceSubscriptionsApiClient;
};
const experienceSubscriptionsClientProviderState = { experienceSubscriptionsClient } as const;

export const ExperienceSubscriptionsClientProviderContext =
  createContext<ExperienceSubscriptionsClientProviderState | null>(null);

export const ExperienceSubscriptionsClientProvider: FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  return (
    <ExperienceSubscriptionsClientProviderContext.Provider
      value={experienceSubscriptionsClientProviderState}>
      {children}
    </ExperienceSubscriptionsClientProviderContext.Provider>
  );
};

export function useExperienceSubscriptionsClientProvider(): ExperienceSubscriptionsClientProviderState {
  const context = useContext(ExperienceSubscriptionsClientProviderContext);
  if (context === null) {
    throw new Error(
      'useExperienceSubscriptionsClientProvider() must be used within a ExperienceSubscriptionsClientProvider',
    );
  }
  return context;
}
