import { makeStyles } from '@rbx/ui';

const useExperiencesTableStyles = makeStyles()((theme) => ({
  alreadyAddedButton: {
    justifyContent: 'end',
    marginRight: 0,
  },
  removeButton: {
    color: theme.palette.content.alert.important,
    justifyContent: 'end',
    marginRight: 0,
  },
  removeButtonCell: {
    display: 'flex',
    justifyContent: 'end',
  },
  tableContainer: {
    marginBottom: 16,
    maxHeight: 330,
    overflowY: 'scroll',
  },
  tableRow: {
    '& td': {
      border: 0,
      paddingBottom: 0,
    },
  },
}));

export default useExperiencesTableStyles;
