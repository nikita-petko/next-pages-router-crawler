import { makeStyles } from '@rbx/ui';

const useGenericTableCellStyles = makeStyles()((theme) => ({
  mobileTableCell: {
    display: 'flex',
    flexDirection: 'row',
    borderBottom: 'none',
    padding: '8px 16px',
    alignItems: 'start',
  },

  titleCell: {
    backgroundColor: theme.palette.actionV2.secondary.fill,
    borderRadius: '8px',
  },

  tableCell: {
    wordBreak: 'break-word',
    verticalAlign: 'middle',
  },

  mobileCell: {
    flex: 1,
  },

  mobileTableCellContent: {
    textAlign: 'right',
    maxWidth: '80%',
  },
}));

export default useGenericTableCellStyles;
