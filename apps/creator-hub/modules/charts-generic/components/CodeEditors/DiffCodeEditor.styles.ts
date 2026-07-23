import { makeStyles } from '@rbx/ui';

const useDiffCodeEditorStyles = makeStyles()(() => ({
  diffEditor: {
    // Changing the unfold icon to a more readable ellipsis
    '& .codicon-unfold:before': {
      content: '"⋯"',
      width: '16px',
      height: '16px',
    },
    // Removing the "3 lines hidden" text. Apparently Monaco does not have a way to turn this off
    '& .monaco-editor .diff-hidden-lines .center div:nth-child(2)': {
      visibility: 'hidden',
    },
    '& .monaco-editor .diff-hidden-lines .center': {
      boxShadow: 'none',
    },
    '& .monaco-diff-editor.side-by-side .editor.modified': {
      boxShadow: 'none',
    },
  },
}));

export default useDiffCodeEditorStyles;
