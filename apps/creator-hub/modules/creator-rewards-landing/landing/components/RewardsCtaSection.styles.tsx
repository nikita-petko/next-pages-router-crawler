import { makeStyles } from '@rbx/ui';

const useRewardsCtaSectionStyles = makeStyles()((theme) => ({
  container: {
    height: 'fit-content',
    marginTop: 120,
  },

  ctaSectionContainer: {
    [theme.breakpoints.down('Medium')]: {
      paddingBottom: 100,
    },
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    height: 'fit-content',
    backgroundImage: `url(${process.env.assetPathPrefix}/creatorRewardsLanding/roblox_background.mp4)`,
    paddingBottom: 200,
  },

  ctaSectionHeading: {
    [theme.breakpoints.down('Medium')]: {
      fontSize: 40,
    },
    fontSize: 56,
    marginBottom: 36,
  },

  ctaButton: {
    width: 'fit-content',
  },

  video: {
    [theme.breakpoints.down('Medium')]: {
      minHeight: 400,
    },
    [theme.breakpoints.up('XXLarge')]: {
      width: 2490,
      left: -1245,
    },
    minHeight: 500,
    display: 'flex',
    position: 'absolute',
    left: '-50vw',
    width: '100vw',
    zIndex: -100,
    objectFit: 'cover',
    alignSelf: 'end',
  },

  videoContainer: {
    [theme.breakpoints.down('Medium')]: {
      marginTop: -300,
      height: 300,
    },
    position: 'relative',
    width: '100vw',
    left: '50%',
    height: 700,
    marginTop: -700,
    display: 'flex',
    zIndex: -100,
  },
}));

export default useRewardsCtaSectionStyles;
