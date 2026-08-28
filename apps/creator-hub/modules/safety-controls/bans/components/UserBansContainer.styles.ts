import { makeStyles } from '@rbx/ui';

const UseUserBansStyles = makeStyles()((theme) => ({
  rootContainer: {
    [theme.breakpoints.down('Medium')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },

  descriptionText: {
    paddingBottom: 14,
  },
  addUsersButton: {
    paddingBottom: 20,
  },
  unbanUsersButton: {
    marginLeft: 20,
  },
  tableContainer: {
    marginTop: 20,
    border: 0,

    '& thead th': {
      verticalAlign: 'middle',
    },

    '& tbody td': {
      verticalAlign: 'middle',
    },
  },
}));

export default UseUserBansStyles;
