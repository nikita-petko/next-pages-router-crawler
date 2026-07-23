import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';

export type TextFilterResponse = {
  isFiltered: boolean;
};

/**
 * Async function that runs an arbitrary string through the platform's
 * text-moderation service. Implementations should resolve with `isFiltered:
 * true` when the input contains disallowed content (e.g. profanity).
 *
 * Implementations are expected to be referentially stable across renders
 * (define them at module scope, or memoize). Consumers like
 * `useTextFilterValidation` insulate themselves from identity churn via a
 * ref, but stable references are still preferred.
 */
export type TextFilterFn = (text: string) => Promise<TextFilterResponse>;

const TextFilterContext = createContext<TextFilterFn | null>(null);

export type TextFilterProviderProps = PropsWithChildren<{
  filterText: TextFilterFn;
}>;

/**
 * Registers a `TextFilterFn` for descendants. Production code should wrap
 * the relevant feature hierarchy with a provider that calls through to the
 * real moderation client; storybook stories and tests should wrap with a
 * mock implementation.
 */
export const TextFilterProvider: FC<TextFilterProviderProps> = ({ children, filterText }) => (
  <TextFilterContext.Provider value={filterText}>{children}</TextFilterContext.Provider>
);

/**
 * Returns the registered `TextFilterFn`. Throws if no provider is mounted —
 * this is intentional: a missing provider would otherwise silently fail open
 * (treating moderated content as safe) which is a security-relevant bug, so
 * we surface it loudly during development and CI.
 */
export const useTextFilter = (): TextFilterFn => {
  const filterText = useContext(TextFilterContext);
  if (!filterText) {
    throw new Error('useTextFilter must be used within a TextFilterProvider');
  }
  return filterText;
};

export default TextFilterContext;
