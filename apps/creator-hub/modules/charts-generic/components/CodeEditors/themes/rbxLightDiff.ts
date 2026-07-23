import type { editor } from 'monaco-editor';
import type { TTheme } from '@rbx/ui';
import { toHexColor } from './colorUtils';
import rbxLight from './rbxLight';

const rbxLightDiff = (theme: TTheme): editor.IStandaloneThemeData => {
  const rbxLightBase = rbxLight(theme);
  return {
    ...rbxLightBase,
    colors: {
      ...rbxLightBase.colors,
      'editor.background': toHexColor(theme.palette.surface[100]),
    },
  };
};

export default rbxLightDiff;
