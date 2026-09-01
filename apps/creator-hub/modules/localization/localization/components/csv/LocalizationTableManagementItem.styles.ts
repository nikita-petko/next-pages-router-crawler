import { makeStyles } from '@rbx/ui';

const LocalizationTableManagementItemStyles = makeStyles()((theme) => ({
  divider: {
    marginTop: 25,
    marginBottom: 20,
  },

  button: {
    paddingLeft: 10,
    display: 'inline-flex',
    justifyContent: 'flex-end',
  },

  list: {
    paddingTop: 0,
    paddingLeft: 25,
  },
}));

export default LocalizationTableManagementItemStyles;
