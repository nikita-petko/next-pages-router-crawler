import { createElement, useEffect, useSyncExternalStore } from 'react';
import { Dialog } from '@rbx/foundation-ui';
import { DEFAULT_RESOLVED_CONTENT_OPTIONS, dialogStore } from './store';
import type { DialogRender, ResolvedContentOptions, DialogStore, ComponentTuple } from './types';

function isComponentTuple(render: DialogRender): render is ComponentTuple {
  return typeof render === 'object' && render !== null && 'Component' in render;
}

/** Delay before clearing content after close, allows exit animations to complete. */
export const UNMOUNT_DELAY_MS = 150;

/**
 * Renders the current dialog from the store. Place once near the top of the
 * React tree (e.g. in `_app.tsx`).
 *
 * In production, reads from the module-level `dialogStore` singleton.
 * Pass an explicit `store` prop in tests for isolation.
 *
 * @example
 * ```tsx
 * import { DialogOutlet } from '@modules/monetization-shared/dialog/outlet';
 *
 * // In _app.tsx or a layout component:
 * <DialogOutlet />
 * ```
 */
export function DialogOutlet({ store: externalStore }: { store?: DialogStore }) {
  const store = externalStore ?? dialogStore;
  const { render, options, isOpen } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  useEffect(() => {
    if (isOpen || options === null || options.shouldUnmountOnClose === false) {
      return undefined;
    }
    const timer = setTimeout(() => store.clearContent(), UNMOUNT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isOpen, options, store]);

  // Skip render if no content is provided
  if (render === null) {
    return null;
  }

  if (options?.mode === 'standalone' && isComponentTuple(render)) {
    return createElement(render.Component, {
      ...render.props,
      open: isOpen,
      onOpenChange: (open: boolean) => {
        if (!open) store.close();
      },
    });
  }

  const resolved = (options ?? DEFAULT_RESOLVED_CONTENT_OPTIONS) as ResolvedContentOptions;

  const rendered = isComponentTuple(render)
    ? createElement(render.Component, render.props)
    : render;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) store.close();
      }}
      size={resolved.size}
      isModal={resolved.isModal}
      hasCloseAffordance={resolved.hasCloseAffordance}
      closeLabel={resolved.closeLabel ?? ''}
      hasMarginTop={resolved.hasMarginTop}
      hasMarginBottom={resolved.hasMarginBottom}
      hasDescription={resolved.hasDescription}>
      {rendered}
    </Dialog>
  );
}
