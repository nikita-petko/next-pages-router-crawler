import { makeStyles } from '@rbx/ui';

const useAddExperiencesModalStyles = makeStyles()((theme) => ({
  addButton: {
    // TODO: STM-5477 Ensure height aligns with search field
    minHeight: 46,
    maxHeight: 46,
  },
  searchContainer: {
    paddingTop: 8,
  },
  searchFieldErrored: {
    '& label': {
      '&.Mui-focused': {
        color: theme.palette.content.alert.important,
      },
    },
  },
  titleContainer: {
    marginBottom: 8,
    padding: 8,
  },
}));

export default useAddExperiencesModalStyles;
