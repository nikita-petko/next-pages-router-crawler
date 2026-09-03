import { makeStyles } from '@rbx/ui';

const useCreatorRewardsBodyStyles = makeStyles()((theme) => ({
  bodySectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('Medium')]: {
      gap: 140,
    },
    [theme.breakpoints.up('Large')]: {
      marginBottom: 120,
    },
    gap: 60,
    marginLeft: 10,
    marginRight: 10,
  },

  lineItemContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    [theme.breakpoints.up('Large')]: {
      gap: 150,
    },
    [theme.breakpoints.up('Medium')]: {
      gap: 40,
    },
    gap: 30,
  },

  container: {
    [theme.breakpoints.up('Medium')]: {
      width: 470,
    },
    width: '100%',
    maxWidth: '100%',
    gap: 24,
    display: 'flex',
    flexDirection: 'column',
    objectFit: 'contain',
    justifyContent: 'center',
  },

  image: {
    [theme.breakpoints.up('Medium')]: {
      height: 300,
    },
    height: 220,
  },

  button: {
    width: 'fit-content',
  },

  builderExtended: {
    fontFamily: 'Builder Mono',
    fontSize: 24,
  },
}));

export default useCreatorRewardsBodyStyles;
