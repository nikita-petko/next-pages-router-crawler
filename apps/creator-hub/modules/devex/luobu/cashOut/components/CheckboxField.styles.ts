import { makeStyles } from '@rbx/ui';

const useFormStyles = makeStyles()((theme) => ({
  margin: {
    marginBottom: theme.spacing(1),
  },

  termsCheckbox: {
    paddingTop: 0,
    paddingBottom: 0,
  },
}));

export default useFormStyles;
