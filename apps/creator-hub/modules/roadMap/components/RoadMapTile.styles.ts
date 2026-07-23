import { makeStyles } from '@rbx/ui';

const useRoadMapTileStyles = makeStyles()((theme) => ({
  newLabel: {
    marginRight: 8,
  },

  container: {
    backgroundColor: theme.palette.surface[200],
    flexDirection: 'column',
    padding: '24px 12px',
    maxWidth: 1516,
    [theme.breakpoints.up('Large')]: {
      flexDirection: 'row',
      padding: 48,
    },
  },

  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
    marginBottom: 24,
    [theme.breakpoints.up('Large')]: {
      paddingRight: 60,
      textAlign: 'left',
    },
  },

  title: {
    marginBottom: 12,
  },

  accordions: {
    '& > *:not(:first-child)': {
      marginTop: 12,
    },
  },

  accordionSummary: {
    alignItems: 'center',
  },

  icon: {
    height: 16,
    marginRight: 13,
  },

  list: {
    '& > *:not(:first-child)': {
      marginTop: 12,
    },
  },
}));

export default useRoadMapTileStyles;
