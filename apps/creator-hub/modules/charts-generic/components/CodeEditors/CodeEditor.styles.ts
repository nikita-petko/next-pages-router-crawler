import { makeStyles } from '@rbx/ui';

const useCodeEditorStyles = makeStyles()(() => ({
  editor: {
    '& .editorPlaceholder': {
      whiteSpace: 'pre-wrap',
    },
  },
}));

export default useCodeEditorStyles;
