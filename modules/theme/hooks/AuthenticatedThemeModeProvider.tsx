import { ThemeModeProvider } from '@rbx/settings';
import React, { FunctionComponent } from 'react';

import { useAuthenticatedUser } from '@hooks/useAuthenticatedUser';
import ModeResponsiveThemeProvider from '@modules/theme/hooks/ModeResponsiveThemeProvider';
import { GetApiSiteBaseUrl } from '@utils/url';

/**
 * Binds Ads Manager to the same theme preference Creator Hub uses.
 *
 * `ThemeModeProvider` reads and writes the creator-settings service and mirrors
 * the result into the `creator-hub-theme-*` localStorage keys. Because Ads
 * Manager is served from `create.roblox.com/advertise`, that cache is shared
 * with Creator Hub, so the mode is already correct on first paint.
 *
 * Must be mounted below the authentication providers — `useAuthenticatedUser`
 * depends on them, and without a user id the preference can only be read from
 * the localStorage cache.
 */
const AuthenticatedThemeModeProvider: FunctionComponent<
  React.PropsWithChildren<{ themeElement?: HTMLElement }>
> = ({ children, themeElement }) => {
  const authenticatedUser = useAuthenticatedUser();

  return (
    <ThemeModeProvider bedev2BaseUrl={GetApiSiteBaseUrl()} currentUser={authenticatedUser}>
      <ModeResponsiveThemeProvider themeElement={themeElement}>
        {children}
      </ModeResponsiveThemeProvider>
    </ThemeModeProvider>
  );
};

export default AuthenticatedThemeModeProvider;
