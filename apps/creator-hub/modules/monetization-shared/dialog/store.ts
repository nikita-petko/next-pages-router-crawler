import type { TDialogProps } from '@rbx/foundation-ui';
import { createStore } from '../lib/store';
import type {
  DialogOptions,
  ResolvedDialogOptions,
  ResolvedContentOptions,
  ContentModeOptions,
  StandaloneModeOptions,
  DialogState,
  DialogStore,
} from './types';

export const DEFAULT_DIALOG_SIZE: NonNullable<TDialogProps['size']> = 'Medium';
export const DEFAULT_DIALOG_IS_MODAL = true;
export const DEFAULT_DIALOG_SHOULD_UNMOUNT_ON_CLOSE = true;

export function resolveOptions(options?: DialogOptions): ResolvedDialogOptions {
  if (options?.mode === 'standalone') {
    return {
      mode: 'standalone',
      shouldUnmountOnClose: options.shouldUnmountOnClose ?? DEFAULT_DIALOG_SHOULD_UNMOUNT_ON_CLOSE,
    } satisfies StandaloneModeOptions;
  }

  const content = (options ?? {}) satisfies ContentModeOptions;
  return {
    mode: 'content',
    size: content.size ?? DEFAULT_DIALOG_SIZE,
    isModal: content.isModal ?? DEFAULT_DIALOG_IS_MODAL,
    hasCloseAffordance: content.closeLabel !== undefined,
    closeLabel: content.closeLabel,
    hasMarginTop: content.hasMarginTop,
    hasMarginBottom: content.hasMarginBottom,
    hasDescription: content.hasDescription,
    shouldUnmountOnClose: content.shouldUnmountOnClose ?? DEFAULT_DIALOG_SHOULD_UNMOUNT_ON_CLOSE,
  };
}

/** Content-mode defaults from `resolveOptions()` — use as outlet fallback when `options` is null. */
export const DEFAULT_RESOLVED_CONTENT_OPTIONS: ResolvedContentOptions =
  resolveOptions() as ResolvedContentOptions; // See above, prob gonna iterate on making this strongly typed later

const INITIAL_STATE: DialogState = {
  render: null,
  options: null,
  isOpen: false,
};

export function createDialogStore(): DialogStore {
  const store = createStore<DialogState>({ ...INITIAL_STATE });

  return {
    ...store,
    open: (render, options) => {
      store.setState({ render, options: resolveOptions(options), isOpen: true });
    },
    close: () => {
      if (!store.getSnapshot().isOpen) {
        return;
      }
      store.setState({ isOpen: false });
    },
    clearContent: () => {
      if (store.getSnapshot().isOpen) {
        return;
      }
      store.setState({ render: null, options: null });
    },
  };
}

export const dialogStore = createDialogStore();
