import { Platform, getCurrentPlatform } from '@rbx/core';

export function getKeyboardShortcut(key: string): string {
  let keyboardShortcut = '';
  const currentPlatform = getCurrentPlatform();
  if (
    currentPlatform === Platform.Windows ||
    currentPlatform === Platform.Linux ||
    currentPlatform === Platform.Unix
  ) {
    keyboardShortcut = `Ctrl + ${key}`;
  } else if (currentPlatform === Platform.macOS) {
    keyboardShortcut = `⌘ + ${key}`;
  }

  return keyboardShortcut;
}

export function getKeyboardShortcutKeys(key: string): string[] {
  const currentPlatform = getCurrentPlatform();
  if (
    currentPlatform === Platform.Windows ||
    currentPlatform === Platform.Linux ||
    currentPlatform === Platform.Unix
  ) {
    return ['Ctrl', key];
  }
  if (currentPlatform === Platform.macOS) {
    return ['⌘', key];
  }
  return [];
}

export function getSearchKeyboardShortcut(prefix: string = ''): string {
  const keyboardShortcut = getKeyboardShortcut('K');
  const keyboardShortCutOrEmpty = keyboardShortcut ? `(${keyboardShortcut})` : '';
  return keyboardShortCutOrEmpty.length ? `${prefix} ${keyboardShortCutOrEmpty}` : prefix;
}

export default { getSearchKeyboardShortcut };
