import { KeyboardEvent } from 'react';
import { KeyHandler } from '../types';

export const enum KeyShortcut {
  Search = 'Search',
}
const enum KeyCodeEnum {
  KeyK = 'KeyK',
  Space = 'Space',
  Enter = 'Enter',
  Escape = 'Escape',
  ctrlKey = 'ctrlKey',
  metaKey = 'metaKey',
}
type KeyCode = keyof typeof KeyCodeEnum;

type Shortcuts = Record<
  string,
  {
    code: KeyCode[]; // OR operation'd
    modifier?: Array<keyof KeyboardEvent<Element>>; // OR operation'd
  }
>;

// key of key shortcuts by { code: possible key code's, modifier: possible key
// modifier's } where combinations of <code>+<modifier> is the shortcut
const shortcuts: Shortcuts = {
  [KeyShortcut.Search]: {
    code: [KeyCodeEnum.KeyK],
    modifier: [KeyCodeEnum.ctrlKey, KeyCodeEnum.metaKey], // either ctrl or meta key
  },
};

export const isKeyShortcut = (name: string | unknown): name is KeyShortcut =>
  typeof name === 'string' && name in shortcuts;

const getOnKeyDownShortcutHandler =
  (
    shortcutName: KeyShortcut,
    callback: () => void, // callback to be executed when the shortcut is pressed
  ): KeyHandler =>
  (event) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const shortcut of Object.keys(shortcuts)) {
      const { code, modifier } = shortcuts[shortcut];
      if (
        shortcutName === shortcut &&
        code.some((c) => event.code === c) &&
        modifier?.some((mod) => event[mod])
      ) {
        event.preventDefault(); // prevent default behavior of the shortcut
        callback();
        break;
      }
    }
  };

export default getOnKeyDownShortcutHandler;
