import type { ComponentType } from 'react';

import { useDialogStore } from '@components/common/dialog/store';
import type { BaseInjectedDialogProps, OpenDialogParams } from '@components/common/dialog/types';

/**
 * Imperatively open a dialog. Works from any caller — React components, event
 * handlers, axios interceptors, async store actions — because it talks to the
 * module-level singleton without a hook.
 *
 * The outlet calls `createElement(component, props)` at render time, so hooks
 * inside the dialog (e.g. `useTranslation`, `useAppStore`) re-evaluate on
 * every render and never see a stale closure.
 *
 * @example
 * ```tsx
 * openDialog({ component: ConfirmDialog, props: { onConfirm: save } });
 * ```
 */
export const openDialog = <P extends object>(input: OpenDialogParams<P>): void => {
  useDialogStore
    .getState()
    .open({ Component: input.component, props: input.props ?? {} }, input.options);
};

/**
 * Close the currently visible dialog regardless of which dialog is up.
 *
 * Reserved for **cross-cutting interrupts** (session expired, ad-block
 * detected, etc.) that genuinely want to dismiss whatever happens to be on
 * screen. To close your own dialog, prefer the per-dialog `closeXDialog`
 * exported from each dialog file (built via `makeOwnedCloser`), which
 * no-ops if the store no longer holds your dialog — protecting deferred
 * callbacks from closing a dialog that has since been replaced.
 *
 * Safe to call when no dialog is open.
 */
export const closeDialog = (): void => {
  useDialogStore.getState().close();
};

/**
 * Build a "close my own dialog" function bound to a specific component. The
 * returned closer no-ops if the store currently holds a different dialog,
 * so deferred callbacks (`.then(closeXDialog)`, post-`await` closes, etc.)
 * can't accidentally dismiss a replacement dialog that took the slot.
 *
 * Dialog files should export the returned function next to their
 * `openXDialog` so cross-component callers have a single, identity-safe
 * closer to import.
 *
 * @example
 * ```tsx
 * // CancelCampaignDialog.tsx
 * export const closeCancelCampaignDialog = makeOwnedCloser(CancelCampaignDialog);
 * ```
 */
export const makeOwnedCloser =
  <P extends object>(Component: ComponentType<P & BaseInjectedDialogProps>): (() => void) =>
  () => {
    const state = useDialogStore.getState();
    if (state.render?.Component === Component) {
      state.close();
    }
  };

/**
 * Lock (`false`) or unlock (`true`) user-initiated dismiss paths (backdrop
 * click, escape key) on the active dialog. Programmatic `closeDialog()` is
 * not gated by this. Dismissibility resets to `true` when a new dialog opens.
 *
 * Dialogs typically receive this via the injected `setDismissible` prop
 * rather than importing it directly.
 */
export const setDismissible = (dismissible: boolean): void => {
  useDialogStore.getState().setDismissible(dismissible);
};
