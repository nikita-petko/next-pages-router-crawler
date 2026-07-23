import { useSyncExternalStore } from 'react';
import { Snackbar } from '@rbx/foundation-ui';
import { snackbarStore } from './store';

/**
 * Renders the current snackbar from the store. Place once near the top of the
 * React tree (e.g. in `_app.tsx`). Does not provide context — the store is a
 * module-level singleton accessed directly by `useSnackbar()`.
 *
 * @example
 * ```tsx
 * import { SnackbarOutlet } from '@modules/monetization-shared/snackbar/outlet';
 *
 * // In _app.tsx or a layout component:
 * <SnackbarOutlet />
 * ```
 */
export function SnackbarOutlet() {
  const { current } = useSyncExternalStore(
    snackbarStore.subscribe,
    snackbarStore.getSnapshot,
    snackbarStore.getSnapshot,
  );

  // Skip render if no content is provided
  if (current === null) {
    return null;
  }

  return <Snackbar key={current.id} {...current.props} onClose={() => snackbarStore.dismiss()} />;
}
