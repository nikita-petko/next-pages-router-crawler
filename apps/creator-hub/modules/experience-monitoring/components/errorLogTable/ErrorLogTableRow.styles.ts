import { makeStyles } from '@rbx/ui';

const useErrorLogTableRowStyles = makeStyles()((theme) => ({
  content: {
    maxHeight: 150,
    overflowY: 'auto',
  },

  tableCell: {
    minWidth: '100px',
  },

  stackTraceContainer: {
    display: 'block',
    padding: 16,
    whiteSpace: 'pre-line',
  },

  warningIcon: {
    color: theme.palette.actionV2.notice.fill,
  },

  highlightContent: {
    backgroundColor: theme.palette.states.hover,
  },
}));

export default useErrorLogTableRowStyles;
