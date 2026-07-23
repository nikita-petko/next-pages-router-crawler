import type { TSnackbarProps } from '@rbx/foundation-ui';
import { createStore } from '../lib/store';

export type SnackbarEntry = {
  id: string;
  props: TSnackbarProps;
};

type SnackbarState = {
  current: SnackbarEntry | null;
};

let nextId = 0;

const store = createStore<SnackbarState>({ current: null });

function enqueue(props: TSnackbarProps): void {
  const outgoing = store.getSnapshot().current;
  outgoing?.props.onClose?.();
  nextId += 1;
  store.setState({ current: { id: `snackbar-${nextId}`, props } });
}

function dismiss(): void {
  const { current } = store.getSnapshot();
  /* istanbul ignore if */
  if (!current) {
    return;
  }
  current.props.onClose?.();
  store.setState({ current: null });
}

export const snackbarStore = { ...store, enqueue, dismiss };
