import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import {
  pageIds,
  TPageIds,
  pages,
  developerProductsBasePath,
  passesBasePath,
  badgesBasePath,
  placesBasePath,
  subscriptionsBasePath,
  environmentsBasePath,
} from '../constants';

type ExperienceNavigationContext = {
  pageId: TPageIds;
  direction: number;
  selected: string | undefined;
  back: (pageId: TPageIds) => void;
  forward: (pageId: TPageIds) => void;
};

export const ExperienceNavigationContext = createContext<ExperienceNavigationContext | null>(null);

export const useExperienceNavigation = () => {
  const context = useContext(ExperienceNavigationContext);
  if (context === null) {
    throw new Error('useExperienceNavigation most be used inside ExperienceNavigationProvider');
  }

  return context;
};

const ExperienceNavigationProvider: React.FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  const { pathname: path } = useRouter();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const selected = useMemo(() => {
    const [key] = Object.entries(pages).find(([, { pathname }]) => pathname === path) || [];
    return key;
  }, [path]);

  const [[pageId, direction], setPageId] = useState<[TPageIds, number]>(() => {
    let initialPageId: TPageIds = 'root';
    if (selected) {
      const [selectedId] = selected.split('.');
      if ((pageIds as readonly string[]).includes(selectedId)) {
        initialPageId = selectedId as TPageIds;
      }
    }
    return [initialPageId, 1];
  });

  useEffect(() => {
    if (path.startsWith(placesBasePath)) {
      setPageId(['places', 1]);
    }
  }, [path]);

  useEffect(() => {
    if (path.startsWith(badgesBasePath)) {
      setPageId(['badges', 1]);
    }
  }, [path]);

  useEffect(() => {
    if (path.startsWith(passesBasePath)) {
      setPageId(['passes', 1]);
    }
  }, [path]);

  useEffect(() => {
    if (path.startsWith(developerProductsBasePath)) {
      setPageId(['developerProducts', 1]);
    }
  }, [path]);

  useEffect(() => {
    if (path.startsWith(subscriptionsBasePath)) {
      setPageId(['subscriptions', 1]);
    }
  }, [path]);

  useEffect(() => {
    if (path.startsWith(environmentsBasePath)) {
      setPageId(['content', 1]);
    }
  }, [path]);

  const back = useCallback(
    (id: TPageIds) => {
      unifiedLogger.logClickEvent({
        eventName: `clickLeftNavPage.back`,
      });
      setPageId([id, -1]);
    },
    [unifiedLogger],
  );

  const forward = useCallback(
    (id: TPageIds) => {
      unifiedLogger.logClickEvent({
        eventName: `clickLeftNavPage.${id}`,
      });
      setPageId([id, 1]);
    },
    [unifiedLogger],
  );

  const value = useMemo(() => {
    return { pageId, direction, selected, back, forward };
  }, [back, direction, forward, pageId, selected]);

  return (
    <ExperienceNavigationContext.Provider value={value}>
      {children}
    </ExperienceNavigationContext.Provider>
  );
};

export default ExperienceNavigationProvider;
