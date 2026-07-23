import { DiffEditorProps, EditorProps } from '@monaco-editor/react';
import { TTheme } from '@rbx/ui';

type OptionType = EditorProps['options'] & {
  'bracketPairColorization.enabled': boolean;
};

const defaultOptions: OptionType = {
  minimap: { enabled: false },
  lineNumbersMinChars: 3,
  'bracketPairColorization.enabled': false,
  scrollBeyondLastLine: false,
  wordWrap: 'on',

  overviewRulerBorder: false,
  overviewRulerLanes: 0,
};

const readOnlyOptions: EditorProps['options'] = {
  readOnly: true,
  domReadOnly: true,
  renderFinalNewline: 'off',
  scrollBeyondLastLine: false,
};

const diffEditorOptions: DiffEditorProps['options'] = {
  ...defaultOptions,
  renderOverviewRuler: false,
  renderSideBySide: true,
  enableSplitViewResizing: false,
  useInlineViewWhenSpaceIsLimited: false,

  hideUnchangedRegions: {
    enabled: true,
    contextLineCount: 2,
    minimumLineCount: 1,
  },

  renderMarginRevertIcon: false,
  glyphMargin: true,
};

const fontSizeNumber = (theme: TTheme) => {
  return Number(theme.typography.codeDense?.fontSize?.toString().replace('px', '') || 16);
};

const formatOptions = (theme: TTheme): EditorProps['options'] => ({
  fontSize: fontSizeNumber(theme),
  fontFamily: theme.typography.codeDense.fontFamily,
});

export const getEditorOptions = (
  theme: TTheme,
  readOnly: boolean,
  autoHeight: boolean,
): EditorProps['options'] => ({
  ...defaultOptions,
  ...formatOptions(theme),
  ...(readOnly ? readOnlyOptions : {}),
  ...(autoHeight ? { scrollbar: { vertical: 'hidden', handleMouseWheel: false } } : {}),
});

export const getDiffEditorOptions = (
  theme: TTheme,
  readOnly: boolean,
  autoHeight: boolean,
): DiffEditorProps['options'] => ({
  ...diffEditorOptions,
  ...formatOptions(theme),
  ...(readOnly ? readOnlyOptions : {}),
  ...(autoHeight ? { scrollbar: { vertical: 'hidden', handleMouseWheel: false } } : {}),
});
