import { makeStyles } from '@rbx/ui';

const useApiKeyNameInputStyes = makeStyles()(() => ({
  inputLabel: {
    marginBottom: 8,
  },

  subLabel: {
    marginTop: 8,
    marginBottom: 4,
  },

  inputBlock: {
    paddingTop: 16,
    marginBottom: 16,
    whiteSpace: 'break-spaces',
  },

  inputWordWrap: {
    // for long descriptions and names so they don't fly off the edit form
    wordWrap: 'break-word',
  },
}));

export default useApiKeyNameInputStyes;
