import { makeStyles } from '@rbx/ui';

const useCollaboratorAutocompleteStyles = makeStyles()({
  avatarCell: {
    columnGap: 15,
  },
  input: {
    '&::placeholder': {
      color: '#CBCBCB', // Match label color
      opacity: 1,
    },
  },
});

export default useCollaboratorAutocompleteStyles;
