import type { FC, PropsWithChildren } from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import type { UnifiedLogger } from '@rbx/unified-logger';
import type { PageLoggerConfig } from '@rbx/unified-logger/react';
import {
  UnifiedLoggerProvider as BaseUnifiedLoggerProvider,
  useUnifiedLoggerProvider,
} from '@rbx/unified-logger/react';
import defaultUnifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';

export { useUnifiedLoggerProvider };
export type { PageContext, UnifiedLoggerProviderState } from '@rbx/unified-logger/react';

type Props = PropsWithChildren<{
  unifiedLogger?: UnifiedLogger;
  pageLoggerConfig?: PageLoggerConfig;
}>;

export const UnifiedLoggerProvider: FC<Props> = ({ children, unifiedLogger, pageLoggerConfig }) => {
  const logger = unifiedLogger ?? defaultUnifiedLoggerClient;
  const { pathname } = useRouter();
  const path = useMemo(() => {
    if (!pathname || typeof window === 'undefined') {
      return undefined;
    }
    return `${window.location.origin}${pathname}`;
  }, [pathname]);

  return (
    <BaseUnifiedLoggerProvider
      unifiedLogger={logger}
      pageLoggerConfig={pageLoggerConfig}
      path={path}>
      {children}
    </BaseUnifiedLoggerProvider>
  );
};
