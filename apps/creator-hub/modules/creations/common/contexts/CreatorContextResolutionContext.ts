import { createContext } from 'react';

/**
 * Whether a `?groupId=` or `?userId=` deep link is still switching the active creator.
 *
 * `useSyncCreatorContextFromQuery` is mounted by the page, because the toolbar that needs this does
 * not render on every tab and mounting it there would drop the link on the ones it misses. This
 * carries its answer down instead of threading it through every container in between.
 *
 * Defaults to false so a tree without the provider behaves as it did before, which is what the
 * transactions page relies on.
 */
const CreatorContextResolutionContext = createContext<{ isResolving: boolean }>({
  isResolving: false,
});

export default CreatorContextResolutionContext;
