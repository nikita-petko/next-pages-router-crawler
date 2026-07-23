import { Dialog, DialogContent } from '@rbx/foundation-ui';
import { createElement, type ReactElement, useEffect } from 'react';

import { closeDialog } from '@components/common/dialog/actions';
import { useDialogStore } from '@components/common/dialog/store';
import type { ComponentTuple, DialogSize } from '@components/common/dialog/types';
import { TranslationNamespace } from '@constants/localization';
import useMediaQuery from '@hooks/useMediaQuery';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

/**
 * Matches the Radix Dialog leave transition timing so content stays mounted
 * long enough for the fade-out animation to complete before unmounting.
 */
export const UNMOUNT_DELAY_MS = 225;

/**
 * Picks the dialog `size` prop based on viewport width so the modal degrades
 * sensibly on narrow screens: Large on desktop, Medium on tablet, Small on
 * phones. The choice is made at the outlet (not inside individual dialogs)
 * because `size` controls the outer container width, which content cannot
 * reach up and change.
 */
const useResponsiveDialogSize = (): DialogSize => {
  const { isLarge, isMedium } = useMediaQuery();
  if (isLarge) {
    return 'Large';
  }
  if (isMedium) {
    return 'Medium';
  }
  return 'Small';
};

/**
 * Renders the currently-active dialog from `useDialogStore`. Mount this once
 * near the root of the React tree (e.g. inside `_app.tsx`). Dialogs are then
 * opened from anywhere via `openDialog()`.
 */
const DialogOutlet = (): ReactElement | null => {
  const { clearContent, dismissible, isOpen, options, render } = useDialogStore();
  const responsiveSize = useResponsiveDialogSize();
  const size: DialogSize = options?.size ?? responsiveSize;
  const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);

  useEffect(() => {
    if (isOpen || options === null || !options.shouldUnmountOnClose) {
      return undefined;
    }
    const timer = setTimeout(clearContent, UNMOUNT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [clearContent, isOpen, options]);

  if (render === null) {
    return null;
  }

  // The outlet constructs the React element on every render — this is the
  // whole point of component mode. Caller-supplied props come first; injected
  // handlers (onClose, setDismissible) are applied last so dialogs cannot
  // override them.
  //
  // Both injected handlers are identity-checked against the active
  // ComponentTuple so deferred callbacks (e.g. `onClose()` after `await
  // onConfirm()`) can't close or toggle dismissibility on a *replacement*
  // dialog if the store's slot was taken over while the original call was
  // in flight. The reference is captured at render time and reads from the
  // store fresh in the handler, so the check is current.
  const activeRender: ComponentTuple = render;
  const isStillActive = (): boolean => useDialogStore.getState().render === activeRender;
  const injectedClose = (): void => {
    if (isStillActive()) {
      closeDialog();
    }
  };
  const injectedSetDismissible = (dismissibleNext: boolean): void => {
    if (isStillActive()) {
      useDialogStore.getState().setDismissible(dismissibleNext);
    }
  };
  const renderedNode = createElement(render.Component, {
    ...render.props,
    onClose: injectedClose,
    setDismissible: injectedSetDismissible,
  });

  // Foundation-UI's `<Dialog>` types `closeLabel` as required when
  // hasCloseAffordance might be true. We satisfy the discriminated union by
  // spreading either the on or off variant, then default the label to the
  // localized `Action.Close` so callers usually don't need to set it.
  const closeAffordanceProps = options?.hasCloseAffordance
    ? ({
        closeLabel: options.closeLabel ?? translate('Action.Close'),
        hasCloseAffordance: true,
      } as const)
    : ({ hasCloseAffordance: false } as const);

  return (
    <Dialog
      {...closeAffordanceProps}
      isModal
      onOpenChange={(next) => {
        // Radix fires onOpenChange only for INTERNAL dismiss triggers
        // (backdrop click, escape key, close affordance). Programmatic close
        // via setting `open={false}` doesn't fire this — so closeDialog()
        // always works regardless of the dismissible flag.
        if (!next && !dismissible) {
          return;
        }
        if (!next) {
          closeDialog();
        }
      }}
      open={isOpen}
      size={size}>
      <DialogContent>{renderedNode}</DialogContent>
    </Dialog>
  );
};

export default DialogOutlet;
