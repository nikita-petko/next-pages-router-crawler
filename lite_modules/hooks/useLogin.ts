import { useRobloxAuthentication } from '@rbx/auth';
import { useCallback } from 'react';

import { GetRedirectBaseUrl } from '@utils/url';

export const useLogin = () => {
  const redirectUri = GetRedirectBaseUrl();
  const { login } = useRobloxAuthentication();

  return useCallback(() => login({ redirectUri: `${redirectUri}/` }), [login, redirectUri]);
};
