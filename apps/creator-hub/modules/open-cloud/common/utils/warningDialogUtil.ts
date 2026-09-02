const luauExecutionSessionScopeType = 'luau-execution-session';

export const luauExecutionSessionReadScope = `${luauExecutionSessionScopeType}:read`;
export const luauExecutionSessionWriteScope = `${luauExecutionSessionScopeType}:write`;

export function isScopeTypeWarningRequired(scopeType: string) {
  return scopeType.endsWith(luauExecutionSessionScopeType);
}
