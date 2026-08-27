import { useEffect } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Applies the tailwind theme class to a specified HTML element.
 */
const useFoundationTheme = (theme: ThemeMode, element?: HTMLElement | null) => {
  useEffect(() => {
    if (element == null) {
      return;
    }
    const { classList } = element;
    classList.remove('light-theme', 'dark-theme', 'system-theme');
    switch (theme) {
      case 'light':
        classList.add('light-theme');
        break;
      case 'dark':
        classList.add('dark-theme');
        break;
      case 'system':
        classList.add('system-theme');
        break;
      default:
        break;
    }
  }, [theme, element]);
};

export default useFoundationTheme;