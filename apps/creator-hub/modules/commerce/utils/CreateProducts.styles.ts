import { makeStyles } from '@rbx/ui';

const useCreateProductsStyles = makeStyles()((theme) => ({
  // sticky footer
  containerPadding: {
    padding: 24,
    paddingLeft: 24,
    paddingRight: 24,
    [theme.breakpoints.down('Medium')]: {
      padding: 16,
      paddingLeft: 24,
      paddingRight: 24,
      flexDirection: 'column-reverse',
    },
    flexDirection: 'row',

    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  tertiaryButton: {
    marginRight: 'auto',
    [theme.breakpoints.down('Medium')]: {
      width: '100%',
    },
  },
  primaryDiv: {
    display: 'flex',
    gap: 12,
    flexDirection: 'row',
    [theme.breakpoints.down('Medium')]: {
      flexDirection: 'column-reverse',
      width: '100%',
    },
  },
  // unsaved changes modal
  modalHeader: {
    padding: '32px 32px 12px 32px',
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  modalContent: {
    padding: '0px 32px 12px 32px',
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  modalDialogAction: {
    display: 'flex',
    padding: '12px 32px 32px 32px',
    justifyContent: 'flex-end',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  // tables
  collapseColumn: {
    width: 0,
  },
  hiddenContainer: {
    display: 'none',
  },
  root: {
    flexGrow: 1,
    height: '100%',
    minHeight: 560,
  },
  divider: {
    marginBottom: 24,
  },
  pagination: {
    whiteSpace: 'nowrap',
    borderBottom: 'none',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  paginationToolbar: {
    padding: 0,
    minHeight: 60,
  },
  thumbnailContainer: {
    height: 48,
    width: 48,
    borderRadius: theme.border.radius.xsmall.borderRadius,
    overflow: 'hidden',
  },
  columnCollapsed: {
    width: 0,
  },
  row: {
    '&:not(:hover) .showOnRowHover': {
      opacity: 0,
      [theme.breakpoints.down('Medium')]: {
        opacity: 1,
      },
    },
  },
  cellCompact: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    maxWidth: 0,
  },
  benefitLabelText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '112px',
    overflowWrap: 'break-word',
    maxWidth: '112px',
    maxHeight: '48px',
    alignItems: 'center',
    paddingLeft: '8px',
  },
  benefitContainer: {
    width: 192,
    height: 48,
    borderRadius: 8,
    backgroundColor: theme.palette.surface[300],
  },
  deleteBenefitIconContainer: {
    width: 16,
    height: 16,
    padding: 0,
    marginLeft: 8,
    marginRight: 8,
  },
  benefitIcon: {
    marginLeft: '8px',
    fontWeight: 700,
    fontSize: '16px',
  },
  configureTableCell: {
    width: '272px',
    color: theme.palette.content.muted,
  },
  checkBox: {
    padding: 8,
  },
  smallTableCell: {
    width: '128px',
    color: theme.palette.content.muted,
  },
  quantityInput: {
    width: 64,
  },
}));
export default useCreateProductsStyles;
