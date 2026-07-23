import { makeStyles } from '@rbx/ui';

const useCollaboratorsTableStyles = makeStyles()((theme) => ({
  accessMenu: {
    width: '40%',
  },
  accessMenuModalView: {
    paddingRight: 0,
    width: '40%',
  },
  button: {
    marginRight: 8,
  },
  divider: {
    marginBottom: 24,
    marginTop: 24,
    width: '100%',
  },
  paginationStyle: {
    borderBottom: 0,
  },
  tableContainer: {
    borderColor: theme.palette.components.divider,
    borderRadius: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    padding: 0,
  },
  tableContainerModalView: {
    marginTop: 16,
    maxHeight: 330,
    overflowY: 'auto',
    padding: 0,
  },
  tableRowModalView: {
    '& td': {
      border: 0,
      paddingBottom: 0,
      paddingLeft: 0,
    },
  },
}));

export default useCollaboratorsTableStyles;
