import { makeStyles } from '@rbx/ui';

const useMultiCheckboxStyles = makeStyles()(() => ({
  spacing: {
    justifyContent: 'space-between',
  },

  checkbox: {
    marginTop: 5,
  },

  checkboxContainer: {
    marginRight: 2,
    marginLeft: 0,
    marginTop: 5,
  },
}));

export default useMultiCheckboxStyles;
