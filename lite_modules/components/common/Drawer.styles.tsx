import { alertClasses, makeStyles } from '@rbx/ui';

const useDrawerStyles = makeStyles()(() => ({
  drawerBodyContent: {
    marginTop: '16px',
  },
  drawerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  educationText: {
    position: 'relative',
    top: '-3px',
  },

  inlineRow: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: '24px',
  },

  pendingDecreaseBanner: {
    [`& .${alertClasses.message}`]: {
      alignItems: 'center',
      display: 'flex',
    },
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
