import { dialogStore } from './store';
import type {
  OpenContentNodeDialogParams,
  OpenComponentDialogParams,
  OpenDialogParams,
  BaseComponentDialogProps,
} from './types';

type OpenDialogAction = {
  (input: OpenContentNodeDialogParams): void;
  <P extends Record<string, unknown> & BaseComponentDialogProps>(
    input: OpenComponentDialogParams<P>,
  ): void;
};

type CloseDialogAction = () => void;

export type DialogActions = {
  open: OpenDialogAction;
  close: CloseDialogAction;
};

/**
 * Alias for `dialogStore.open` - use this to open a new dialog to the Outlet without depending on a hook.
 *
 * @example
 * ```tsx
 * import { openDialog } from '@modules/monetization-shared/dialog/actions';
 *
 * openDialog({ content: <HelloDialogContent />, options: { size: 'Small' } });
 * ```
 */
export const openDialog: OpenDialogAction = (input: OpenDialogParams): void => {
  if ('content' in input) {
    dialogStore.open(input.content, input.options);
  } else {
    dialogStore.open({ Component: input.component, props: input.props ?? {} }, input.options);
  }
};

/**
 * Alias for `dialogStore.close` - use this to close the current dialog without depending on a hook.
 *
 * @example
 * ```tsx
 * import { closeDialog } from '@modules/monetization-shared/dialog/actions';
 *
 * closeDialog();
 * ```
 */
export const closeDialog: CloseDialogAction = dialogStore.close;

/** Stable actions object to be used in the hook. */
const actions = {
  open: openDialog,
  close: closeDialog,
} as const satisfies DialogActions;

/**
 * Hook to open and close dialogs via the global dialog store.
 * Context-free — works anywhere in the component tree, including inside
 * `DialogOutlet`-rendered components.
 *
 * @example Content mode — pass ReactNode directly
 * ```tsx
 * import { useDialogActions } from '@modules/monetization-shared/dialog/actions';
 *
 * function MyComponent() {
 *   const { open, close } = useDialogActions();
 *
 *   const handleClick = () => {
 *     open({
 *       content: (
 *         <DialogContent>
 *           <DialogBody>
 *             <DialogTitle>Confirm</DialogTitle>
 *           </DialogBody>
 *           <DialogFooter>
 *             <Button onClick={close}>OK</Button>
 *           </DialogFooter>
 *         </DialogContent>
 *       ),
 *     });
 *   };
 *
 *   return <button onClick={handleClick}>Open dialog</button>;
 * }
 * ```
 *
 * @example Standalone mode — component manages its own Dialog
 * ```tsx
 * const { open } = useDialogActions();
 *
 * open({
 *   component: RescheduleEventDialog,
 *   props: { eventId: 42 },
 *   options: { mode: 'standalone' },
 * });
 * ```
 */
export function useDialogActions(): DialogActions {
  return actions;
}
