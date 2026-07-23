// Adapted from creator-hub: https://github.rbx.com/Roblox/creator-hub/blob/master/apps/creator-hub/modules/charts-generic/components/FilterDrawer/DialogEventEmitter.ts

import { useCallback, useEffect, useState } from 'react';

export type DialogEventEmitter = {
  registerOnApply: (fn: () => void) => void;
  registerOnClear: (fn: () => void) => void;
  registerOnReset: (fn: () => void) => void;
  unregisterOnApply: (fn: () => void) => void;
  unregisterOnClear: (fn: () => void) => void;
  unregisterOnReset: (fn: () => void) => void;
};

function isArraySetDifferent<T>(a: Array<T>, b: Array<T>): boolean {
  if (a.length !== b.length) {
    return true;
  }
  // we don't care about ordering so use Set to decide
  const aSet = new Set(a);
  for (let idx = 0; idx < b.length; idx += 1) {
    if (!aSet.has(b[idx])) {
      return true;
    }
  }
  return false;
}

export function usePendingDialogState<T>(
  initial: Array<T>,
  emitter?: DialogEventEmitter,
  onChangeSubmit?: (newValue: Array<T>) => void,
  /** when overrideSignal is provided, listen to its changes and update current */
  overrideSignal?: Array<T>,
): [Array<T>, (newValue: Array<T>) => void] {
  const [current, setCurrent] = useState<Array<T>>(initial);
  useEffect(() => {
    const onReset = () => setCurrent(initial);
    const onApply = () => {
      if (!onChangeSubmit || !isArraySetDifferent(initial, current)) {
        return;
      }
      onChangeSubmit(current);
    };
    const onClear = () => setCurrent([]);
    if (emitter) {
      emitter.registerOnReset(onReset);
      emitter.registerOnApply(onApply);
      emitter.registerOnClear(onClear);
    }
    return () => {
      if (emitter) {
        emitter.unregisterOnReset(onReset);
        emitter.unregisterOnApply(onApply);
        emitter.unregisterOnClear(onClear);
      }
    };
  }, [current, initial, onChangeSubmit, setCurrent, emitter]);

  useEffect(() => {
    if (overrideSignal) {
      setCurrent(overrideSignal);
    }
  }, [overrideSignal]);

  // Wrap the setter in case there is no shared drawer emitter
  const setCurrentWrapper = useCallback(
    (newValue: Array<T>) => {
      setCurrent(newValue);
      if (!emitter && onChangeSubmit) {
        onChangeSubmit(newValue);
      }
    },
    [emitter, onChangeSubmit],
  );
  return [current, setCurrentWrapper];
}

export class DialogEventEmitterSource implements DialogEventEmitter {
  private onReset: Array<() => void> = [];

  private onClear: Array<() => void> = [];

  private onApply: Array<() => void> = [];

  registerOnReset(fn: () => void) {
    this.onReset.push(fn);
  }

  registerOnApply(fn: () => void) {
    this.onApply.push(fn);
  }

  registerOnClear(fn: () => void) {
    this.onClear.push(fn);
  }

  unregisterOnReset(fn: () => void) {
    this.onReset = this.onReset.filter((f) => f !== fn);
  }

  unregisterOnApply(fn: () => void) {
    this.onApply = this.onApply.filter((f) => f !== fn);
  }

  unregisterOnClear(fn: () => void) {
    this.onClear = this.onClear.filter((f) => f !== fn);
  }

  reset() {
    this.onReset.forEach((fn) => fn());
  }

  apply() {
    this.onApply.forEach((fn) => fn());
  }

  clear() {
    this.onClear.forEach((fn) => fn());
  }
}
