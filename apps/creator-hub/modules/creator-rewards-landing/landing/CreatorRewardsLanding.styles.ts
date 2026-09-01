import { makeStyles } from '@rbx/ui';

const useCreatorRewardsLandingStyles = makeStyles()((theme) => ({
  rewardsLandingPageContainer: {
    width: 'calc(100vw - 20px)', // to allow the bg videos to be full width w/o a horizontal scrollbar
    overflow: 'clip',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
  },

  rewardsLandingPage: {
    [theme.breakpoints.down('Medium')]: {
      padding: '200px 24px 24px',
      overflow: 'clip',
    },
    paddingTop: 200,
    maxWidth: 1120,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 140,
    alignContent: 'center',
    overflow: 'visible',
    whiteSpace: 'pre-line', // for newlines in paragraphs
  },
}));

export default useCreatorRewardsLandingStyles;
