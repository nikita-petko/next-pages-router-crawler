import { useMemo } from 'react';
import type { Monaco } from '@monaco-editor/react';
import type { TTheme } from '@rbx/ui';
import { useTheme } from '@rbx/ui';
import rbxDark from './rbxDark';
import rbxDarkDiff from './rbxDarkDiff';
import rbxLight from './rbxLight';
import rbxLightDiff from './rbxLightDiff';

export enum RbxEditorTheme {
  Light = 'rbx-light',
  Dark = 'rbx-dark',
  LightDiff = 'rbx-light-diff',
  DarkDiff = 'rbx-dark-diff',
}

export const registerThemes = (monaco: Monaco, theme: TTheme) => {
  monaco.editor.defineTheme(RbxEditorTheme.Light, rbxLight(theme));
  monaco.editor.defineTheme(RbxEditorTheme.Dark, rbxDark(theme));
  monaco.editor.defineTheme(RbxEditorTheme.LightDiff, rbxLightDiff(theme));
  monaco.editor.defineTheme(RbxEditorTheme.DarkDiff, rbxDarkDiff(theme));
};

export const useEditorTheme = (mode?: 'editor' | 'diff') => {
  const theme = useTheme();
  const editorTheme = useMemo(() => {
    if (mode === 'diff') {
      return theme.palette.mode === 'dark' ? RbxEditorTheme.DarkDiff : RbxEditorTheme.LightDiff;
    }
    return theme.palette.mode === 'dark' ? RbxEditorTheme.Dark : RbxEditorTheme.Light;
  }, [theme.palette.mode, mode]);
  return editorTheme;
};
