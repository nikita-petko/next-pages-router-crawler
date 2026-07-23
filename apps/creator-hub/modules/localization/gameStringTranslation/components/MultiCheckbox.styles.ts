import { makeStyles } from '@rbx/ui';

const useMultiCheckboxStyles = makeStyles()((theme) => ({
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
