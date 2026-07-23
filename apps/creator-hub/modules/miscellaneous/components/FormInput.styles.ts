import { makeStyles } from '@rbx/ui';

const useFormInputStyles = makeStyles()((theme) => ({
  inputLabel: {
    marginBottom: theme.spacing(2 / 3),
  },

  limitLabel: {
    float: 'right',
  },

  limitLabelError: {
    color: theme.palette.actionV2.important.fill,
  },
}));

export default useFormInputStyles;
