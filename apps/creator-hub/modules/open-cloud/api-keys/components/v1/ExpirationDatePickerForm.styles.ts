import { makeStyles } from '@rbx/ui';

const useExpirationDatePickerFormStyles = makeStyles()((theme) => ({
  inputBlock: {
    paddingTop: 16,
    marginBottom: 16,
  },

  subHeading: {
    marginBottom: 8,
  },

  datePicker: {
    [theme.breakpoints.up('Medium')]: {
      float: 'right',
      width: '50%',
    },
  },

  tooltip: {
    marginLeft: 4,
  },
}));

export default useExpirationDatePickerFormStyles;
