import { makeStyles } from '@rbx/ui';

const useStyles = makeStyles()((theme) => ({
  layout: {
    maxWidth: 1200,
    width: '100%',
    margin: 'auto',
    padding: 32,
    [theme.breakpoints.down('XLarge')]: {
      padding: 24,
    },
  },
  header: {
    marginTop: 60,
    flexDirection: 'row',
    '& > *': {
      flexBasis: '50%',
    },
    '& > *:first-child': {
      marginRight: '10%',
    },

    [`${theme.breakpoints.down('Large')}`]: {
      marginTop: 20,
      flexDirection: 'column',
      '& > *': {
        flexBasis: '100%',
      },
      '& > *:first-child': {
        marginRight: 0,
      },
    },
  },
  headerContent: {
    '& > *': {
      marginBottom: 16,
    },
    '& > button': {
      marginTop: 16,
      alignSelf: 'flex-start',
      [`${theme.breakpoints.down('Large')}`]: {
        alignSelf: 'center',
      },
    },
  },
  card: {
    marginTop: 60,
    marginBottom: 60,
  },
  cardContent: {
    display: 'block',
    paddingBottom: 16,
  },
  footer: {
    marginBottom: 60,
    alignSelf: 'center',
    width: '60%',
    '& > *': {
      marginBottom: 16,
    },

    '& > button': {
      marginTop: 16,
    },

    [`${theme.breakpoints.down('Large')}`]: {
      width: '100%',
    },
  },
  footerContent: {
    alignSelf: 'center',
  },
}));

export default useStyles;
