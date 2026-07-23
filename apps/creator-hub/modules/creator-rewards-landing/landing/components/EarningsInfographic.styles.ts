import { makeStyles } from '@rbx/ui';

const largeVideoHeight = 538;
const largeVideoWidth = 1116;
const smallVideoHeight = 290;
const smallVideoWidth = 602;

const largeChartLinesWidth = 1642;
const largeChartLinesHeight = 450;

const useEarningsInfographicStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
  },

  videoContainer: {
    [theme.breakpoints.up('Medium')]: {
      height: largeVideoHeight,
      display: 'block',
    },
    [theme.breakpoints.up('Large')]: {
      alignSelf: 'center',
    },

    position: 'relative',
    height: smallVideoHeight,
    marginTop: 80,
    overflow: 'visible',
    width: 0,
  },

  videoItem: {
    [theme.breakpoints.up('Medium')]: {
      left: (-1 * largeChartLinesWidth) / 5,
      top: 110,
      height: largeChartLinesHeight,
    },
    [theme.breakpoints.up('Large')]: {
      left: (-1 * largeChartLinesWidth) / 2,
      objectFit: 'contain',
      alignSelf: 'left',
    },
    alignSelf: 'center',
    left: (-1 * smallVideoWidth) / 2,
    position: 'absolute',
    height: smallVideoHeight,
    overflow: 'visible',
    top: 50,
    objectFit: 'cover',
  },

  videoBackground: {
    [theme.breakpoints.up('Medium')]: {
      height: largeVideoHeight,
    },
    [theme.breakpoints.up('Large')]: {
      objectFit: 'contain',
      objectPosition: 'center',
      left: -1 * (largeVideoWidth / 2),
    },
    objectPosition: 'left',
    left: 0,
    position: 'absolute',
    height: smallVideoHeight,
    overflow: 'hidden',
    objectFit: 'cover',
  },

  image: {
    maxWidth: '100%',
    marginTop: 80,
    backgroundImage: `${process.env.assetPathPrefix}/creatorRewardsLanding/06_chart.png`,
  },

  heroText: {
    [theme.breakpoints.down('Medium')]: {
      fontSize: 40,
    },
    fontSize: 56,
    marginBottom: 18,
  },

  infoContainer: {
    [theme.breakpoints.up('Large')]: {
      gap: 100,
    },
    [theme.breakpoints.up('Medium')]: {
      marginTop: 40,
      flexDirection: 'row',
      gap: 20,
    },
    flexDirection: 'column',
    width: '100%',
    marginTop: 80,
    display: 'flex',
    flex: '1 1 1',
    flexWrap: 'nowrap',
    textAlign: 'left',
    gap: 60,
    marginLeft: 10,
    marginRight: 10,
  },

  infoItem: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },

  ctaButton: {
    width: 'fit-content',
  },

  builderExtended: {
    fontFamily: 'Builder Mono',
    fontSize: 24,
  },
}));

export default useEarningsInfographicStyles;
