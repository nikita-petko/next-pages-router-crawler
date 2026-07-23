import { create } from 'zustand';

import type {
  ComponentTuple,
  DialogOptions,
  DialogState,
  ResolvedDialogOptions,
} from '@components/common/dialog/types';

const DEFAULT_SHOULD_UNMOUNT_ON_CLOSE = true;
const DEFAULT_HAS_CLOSE_AFFORDANCE = false;

const resolveOptions = (options?: DialogOptions): ResolvedDialogOptions => ({
  closeLabel: options?.closeLabel,
  hasCloseAffordance: options?.hasCloseAffordance ?? DEFAULT_HAS_CLOSE_AFFORDANCE,
  shouldUnmountOnClose: options?.shouldUnmountOnClose ?? DEFAULT_SHOULD_UNMOUNT_ON_CLOSE,
  size: options?.size,
});

const INITIAL_STATE: DialogState = {
  dismissible: true,
  isOpen: false,
  options: null,
  render: null,
};

interface DialogStoreActions {
  /** Clears stored content. No-op while a dialog is open. */
  clearContent: () => void;
  /** Sets isOpen to false. Content remains mounted until clearContent runs. */
  close: () => void;
  /** Opens a new dialog. Last-in wins — replaces any currently visible dialog. */
  open: (render: ComponentTuple, options?: DialogOptions) => void;
  /**
   * Locks (`false`) or unlocks (`true`) user-initiated dismiss paths
   * (backdrop click, escape key). Programmatic close is unaffected.
   * Resets to `true` whenever a new dialog opens.
   */
  setDismissible: (dismissible: boolean) => void;
}

type DialogStore = DialogState & DialogStoreActions;

export const useDialogStore = create<DialogStore>((set, get) => ({
  ...INITIAL_STATE,
  clearContent: () => {
    if (get().isOpen) {
      return;
    }
    set({ dismissible: true, options: null, render: null });
  },
  close: () => {
    if (!get().isOpen) {
      return;
    }
    set({ isOpen: false });
  },
  open: (render, options) => {
    set({ dismissible: true, isOpen: true, options: resolveOptions(options), render });
  },
  setDismissible: (dismissible) => {
    set({ dismissible });
  },
}));
