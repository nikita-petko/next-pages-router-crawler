const IMPERSONATION_COOKIE_PREFIX = 'ad-account-imp-info=';

export const isImpersonatingAdAccount = (): boolean =>
  typeof document !== 'undefined' &&
  document.cookie
    .split('; ')
    .some(
      (cookie) =>
        cookie.startsWith(IMPERSONATION_COOKIE_PREFIX) &&
        cookie.length > IMPERSONATION_COOKIE_PREFIX.length,
    );
