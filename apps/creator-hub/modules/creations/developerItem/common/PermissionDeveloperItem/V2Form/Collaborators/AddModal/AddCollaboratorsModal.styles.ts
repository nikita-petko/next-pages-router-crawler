import { makeStyles } from '@rbx/ui';

const useAddCollaboratorsModalStyles = makeStyles()(() => ({
  autocomplete: {
    paddingTop: 8,
  },
  input: {
    '&::placeholder': {
      color: '#CBCBCB', // Match label color
      opacity: 1,
    },
  },
  titleContainer: {
    marginBottom: 8,
    padding: 8,
  },
}));

export default useAddCollaboratorsModalStyles;
