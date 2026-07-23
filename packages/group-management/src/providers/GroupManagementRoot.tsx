import type { FunctionComponent, PropsWithChildren } from 'react';
import React, { useState } from 'react';
import type { QueryClientConfig } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { TranslationResourceProvider } from '@rbx/intl';
import { LocalizationProvider } from '@rbx/intl';
import type { ThemeMode } from '@rbx/ui';
import { DialogProvider, UIThemeProvider } from '@rbx/ui';
import type {
  AuthenticatedUser,
  GroupData,
  GroupManagementErrorComponents,
  GroupManagementLogger,
  GroupManagementNavigation,
  GroupManagementStudio,
  GroupManagementSurface,
} from '../utils/types';
import GroupManagementProvider from './GroupManagementProvider';

const defaultQueryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
};

export type GroupManagementThemeModeConfig = {
  bedev2BaseUrl: string;
  currentUser?: AuthenticatedUser | null;
};

export type GroupManagementRootProvidersProps = PropsWithChildren<{
  group: GroupData;
  user: AuthenticatedUser;
  surface: GroupManagementSurface;
  navigation: GroupManagementNavigation;
  showToast: (message: string, isError?: boolean) => void;
  translationProvider: TranslationResourceProvider;
  theme?: ThemeMode;
  queryClient?: QueryClient;
  studio?: GroupManagementStudio;
  errorComponents?: GroupManagementErrorComponents;
  unifiedLogger?: GroupManagementLogger;
}>;

/**
 * Composes every generic provider group-management needs (react-query, intl,
 * UI theme, dialogs) around {@link GroupManagementProvider} so consumers only
 * supply host-specific values. Use {@link GroupManagementProvider} directly when
 * the host already sets up these providers app-wide.
 */
const GroupManagementRootProviders: FunctionComponent<GroupManagementRootProvidersProps> = ({
  group,
  user,
  surface,
  navigation,
  showToast,
  translationProvider,
  theme,
  queryClient,
  studio,
  errorComponents,
  unifiedLogger,
  children,
}) => {
  const [fallbackQueryClient] = useState(() => new QueryClient(defaultQueryClientConfig));
  const activeQueryClient = queryClient ?? fallbackQueryClient;

  return (
    <QueryClientProvider client={activeQueryClient}>
      <LocalizationProvider provider={translationProvider}>
        <UIThemeProvider theme={theme}>
          <DialogProvider>
            <GroupManagementProvider
              surface={surface}
              group={group}
              navigation={navigation}
              user={user}
              showToast={showToast}
              studio={studio}
              errorComponents={errorComponents}
              unifiedLogger={unifiedLogger}>
              {children}
            </GroupManagementProvider>
          </DialogProvider>
        </UIThemeProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  );
};

export default GroupManagementRootProviders;
