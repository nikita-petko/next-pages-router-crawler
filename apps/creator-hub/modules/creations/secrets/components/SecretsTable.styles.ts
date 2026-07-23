import { makeStyles } from '@rbx/ui';

const useSecretsTableStyles = makeStyles()({
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
    marginBottom: 32,
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
  titleDescription: {
    paddingBottom: 36,
  },
  namesColumn: {
    // Widths are set to prevent table columns from bouncing around
    // depending on content width, and to preserve a general aesthetic of the
    // Figma's spec (to not use the whole width of the screen)
    minWidth: 240,
    width: '20%',
  },
  domainColumn: {
    minWidth: 120,
  },
  timesColumn: {
    // minWidth is set to prevent columns from bouncing around, since these
    // times are actually pretty dynamic
    minWidth: 210,
  },
});

export default useSecretsTableStyles;
