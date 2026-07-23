const OidcScopes = ['openid', 'profile', 'email', 'credentials', 'verification'];

export default function getDeveloperFacingScopes(scope: string, operation: string) {
  return OidcScopes.includes(scope) ? scope : `${scope}:${operation}`;
}
