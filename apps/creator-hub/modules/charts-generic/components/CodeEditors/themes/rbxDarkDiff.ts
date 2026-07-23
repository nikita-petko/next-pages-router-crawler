import type { editor } from 'monaco-editor';
import type { TTheme } from '@rbx/ui';
import { toHexColor } from './colorUtils';
import rbxDark from './rbxDark';

const rbxDarkDiff = (theme: TTheme): editor.IStandaloneThemeData => {
  const rbxDarkBase = rbxDark(theme);
  return {
    ...rbxDarkBase,
    colors: {
      ...rbxDarkBase.colors,
      'editor.background': toHexColor(theme.palette.surface[100]),
    },
  };
};

export default rbxDarkDiff;
