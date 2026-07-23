import React, { FunctionComponent } from 'react';
import { ThemeModeProvider } from '@rbx/settings';
import { useAuthentication } from '@modules/authentication/providers';

const AuthenticatedThemeModeProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const { user } = useAuthentication();
  return (
    <ThemeModeProvider bedev2BaseUrl={process.env.bedev2BaseUrl} currentUser={user}>
      {children}
    </ThemeModeProvider>
  );
};

export default AuthenticatedThemeModeProvider;
