import type { editor } from 'monaco-editor';
import { TTheme } from '@rbx/ui';
import rbxLight from './rbxLight';

const rbxLightDiff = (theme: TTheme): editor.IStandaloneThemeData => {
  const rbxLightBase = rbxLight(theme);
  return {
    ...rbxLightBase,
    colors: {
      ...rbxLightBase.colors,
      'editor.background': theme.palette.surface[100],
    },
  };
};

export default rbxLightDiff;
