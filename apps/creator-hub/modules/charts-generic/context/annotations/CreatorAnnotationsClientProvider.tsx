import type { FC } from 'react';
import React, { createContext, useCallback, useMemo } from 'react';
import { creatorAnnotationsClient } from '@modules/clients/analytics';
import type { TimeSeriesAnnotation } from '../../charts/types/Annotations';
import type { AnnotationsClientProviderState } from '../../types/AnnotationsClientProviderState';

export const CreatorAnnotationsClientContext = createContext<AnnotationsClientProviderState | null>(
  null,
);

export const CreatorAnnotationsClientProvider: FC<React.PropsWithChildren> = ({ children }) => {
  const hydrateAnnotations = useCallback(async (): Promise<TimeSeriesAnnotation[]> => {
    return new Promise(() => {
      return [];
    });
  }, []);

  const value = useMemo(() => {
    return {
      annotationsClient: {
        ...creatorAnnotationsClient,
        hydrateAnnotations,
      },
    };
  }, [hydrateAnnotations]);

  return (
    <CreatorAnnotationsClientContext.Provider value={value}>
      {children}
    </CreatorAnnotationsClientContext.Provider>
  );
};
