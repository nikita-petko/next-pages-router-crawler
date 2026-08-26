import { makeStyles } from '@rbx/ui';

const useDrawerStyles = makeStyles()(() => ({
  drawerBodyContent: {
    marginTop: '16px',
  },
  drawerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  inlineRow: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: '24px',
  },

  pendingDecreaseBanner: {
    width: '100%',
  },

  splitRow: {
    '& > *': {
      flex: '1 1 auto',
    },
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
  },
}));

export default useDrawerStyles;
