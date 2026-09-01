import { makeStyles } from '@rbx/ui';

const useRewardsHeroUnitStyles = makeStyles()((theme) => ({
  heroContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  centeredTextHeroContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },

  heroImage: {
    maxWidth: '85vw',
    maxHeight: 372,
    overflow: 'visible',
    marginLeft: -90,
    marginRight: -90,
    zIndex: -99,
    objectFit: 'contain',
  },

  video: {
    [theme.breakpoints.down('Medium')]: {
      height: 418,
      width: 1005,
    },
    [theme.breakpoints.up('XXLarge')]: {
      width: 2490,
      left: -1245,
    },
    position: 'absolute',
    left: '-50vw',
    width: '100vw',
    zIndex: -100,
  },

  videoContainer: {
    display: 'block',
    position: 'relative',
    width: '100vw',
    left: '50%',
    marginTop: -200,
    marginBottom: 200,
    zIndex: -100,
  },
}));

export default useRewardsHeroUnitStyles;
