import { alertClasses, makeStyles } from '@rbx/ui';

const useTransitionBannerStyles = makeStyles()(() => ({
  bannerContainer: {
    [`& .${alertClasses.message}`]: {
      padding: 0,
      width: '100%',
    },
    alignItems: 'center',
    display: 'flex',
    width: '100%',
  },
  bannerContent: {
    alignItems: 'center',
    display: 'flex',
    gap: '16px',
    padding: '6px 0px',
    width: '100%',
  },
  bannerTextContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: '2px',
  },
  bannerTitle: {
    fontWeight: 700,
  },
  classicCreationFlowBanner: {
    marginBottom: '32px',
    marginTop: '32px',
  },
  closeButton: {
    color: '#FFFFFF',
    flexShrink: 0,
  },
  hereText: {
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  learnMoreLink: {
    cursor: 'pointer',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
}));

export default useTransitionBannerStyles;
