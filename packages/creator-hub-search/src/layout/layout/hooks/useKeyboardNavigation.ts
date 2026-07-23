import { useEffect } from 'react';
import { KeyHandler } from '../types';
import getOnKeyDownShortcutHandler, {
  isKeyShortcut,
  KeyShortcut,
} from '../utils/keyboardShortcutHandler';

const useKeyboardNavigation = (
  keyShortcutOrOnKeyDownFn: KeyHandler | KeyShortcut,
  shortcutCallback?: () => void,
) => {
  useEffect(() => {
    let onKeyDown: KeyHandler;
    if (isKeyShortcut(keyShortcutOrOnKeyDownFn)) {
      if (!shortcutCallback)
        throw new Error('shortcutCallback is required when shortcutName is provided');
      onKeyDown = getOnKeyDownShortcutHandler(keyShortcutOrOnKeyDownFn, shortcutCallback);
    } else {
      onKeyDown = keyShortcutOrOnKeyDownFn;
    }

    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.addEventListener('keydown', onKeyDown as any);
    }
    return () => {
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.removeEventListener('keydown', onKeyDown as any);
      }
    };
  }, [keyShortcutOrOnKeyDownFn, shortcutCallback]);
};

export default useKeyboardNavigation;
