import { makeStyles } from '@rbx/ui';

const useCollaboratorsTableHeaderStyles = makeStyles()({
  addCollaboratorsButton: {
    height: 42,
  },
  collaboratorSearchInput: {
    height: 42,
  },
  collaboratorTypeDropdown: {
    height: 42,
    '& .MuiSelect-select': {
      alignItems: 'center',
      display: 'flex',
      height: 42,
      paddingBottom: 0,
      paddingTop: 0,
    },
  },
  headerContainer: {
    alignItems: 'center',
    display: 'flex',
    height: 42,
  },
});

export default useCollaboratorsTableHeaderStyles;
