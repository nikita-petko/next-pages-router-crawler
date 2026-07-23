import { makeStyles } from '@rbx/ui';

const useHighlightingCodeBlockStyles = makeStyles()((theme) => ({
  codeTextBlock: {
    margin: 0,
    fontSize: '14px',
    overflowX: 'auto',
    textAlign: 'left',
  },

  codeTextBlockEllipsis: {
    overflowX: 'hidden',
    overflowY: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'break-spaces',
    wordBreak: 'break-all',
    display: '-webkit-box',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
    // Fall back to two lines with no ellipses if the browser doesn't support box-orient
    lineHeight: '20px',
    maxHeight: '40px',
  },

  iconButtonColor: {
    color: theme.palette.states.active,
  },

  codeBlockContainer: {
    minWidth: 0,
  },
}));

export default useHighlightingCodeBlockStyles;
