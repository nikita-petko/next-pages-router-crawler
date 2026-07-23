import type { editor } from 'monaco-editor';
import { TTheme } from '@rbx/ui';
import rbxDark from './rbxDark';

const rbxDarkDiff = (theme: TTheme): editor.IStandaloneThemeData => {
  const rbxDarkBase = rbxDark(theme);
  return {
    ...rbxDarkBase,
    colors: {
      ...rbxDarkBase.colors,
      'editor.background': theme.palette.surface[100],
    },
  };
};

export default rbxDarkDiff;
