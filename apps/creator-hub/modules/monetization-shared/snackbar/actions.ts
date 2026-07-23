/* istanbul ignore file */
import { snackbarStore } from './store';

export type SnackbarActions = {
  enqueue: typeof snackbarStore.enqueue;
};

/**
 * Hook to access snackbar actions. Use this to enqueue a new snackbar.
 *
 * @example
 * ```tsx
 * import { useSnackbar } from '@modules/monetization-shared/snackbar/actions';
 *
 * function MyComponent() {
 *   const { enqueue } = useSnackbar();
 *   const handleClick = () => {
 *     enqueue({ title: 'New snackbar' });
 *   };
 *
 *   return <button onClick={handleClick}>Show snackbar</button>;
 * }
 * ```
 */
export function useSnackbar(): SnackbarActions {
  return { enqueue: snackbarStore.enqueue };
}

/**
 * Alias for `snackbarStore.enqueue` - use this to enqueue a new snackbar without depending on a hook.
 *
 * @example
 * ```tsx
 * import { toast } from '@modules/monetization-shared/snackbar/actions';
 *
 * toast({ title: 'New snackbar' });
 * ```
 */
export const toast = snackbarStore.enqueue;
