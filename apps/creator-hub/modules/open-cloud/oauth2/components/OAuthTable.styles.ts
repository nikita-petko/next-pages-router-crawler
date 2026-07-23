import { makeStyles } from '@rbx/ui';

const useOAuthTableStyles = makeStyles()({
  pagination: {
    whiteSpace: 'nowrap',
    borderBottom: 'none',
    display: 'flex',
  },
  paginationToolbar: {
    padding: 0,
  },
  createButton: {
    marginTop: 32,
    marginBottom: 16,
  },
  lastTableColumnCell: {
    width: '100%',
    whiteSpace: 'nowrap',
  },
  actionsCell: {
    whiteSpace: 'nowrap',
  },
  section: {
    width: '100%',
    height: '100%',
  },
  emptyTextContainer: {
    textAlign: 'center',
    margin: `16px 0px`,
  },
  namesColumn: {
    // Widths are set to prevent table columns from bouncing around
    // depending on content width, and to preserve a general aesthetic of the
    // Figma's spec (to not use the whole width of the screen)
    minWidth: 450,
    width: '30%',
  },
  timesColumn: {
    // minWidth is set to prevent columns from bouncing around, since these
    // times are actually pretty dynamic
    minWidth: 200,
  },
  statusColumn: {
    // minWidth is set to prevent columns from bouncing around, since these
    // times are actually pretty dynamic
    minWidth: 150,
  },
  appIconClass: {
    width: 42,
    height: 42,
  },
  iconContainer: {
    marginRight: 8,
  },
});

export default useOAuthTableStyles;
