import { makeStyles } from '@rbx/ui';

const useExperiencesTableRowStyles = makeStyles<void, 'watchlistControl'>()(
  (theme, _, classes) => ({
    thumbnailContainer: {
      width: '40px',
      height: '40px',
      marginRight: '10px',
    },

    thumbnailBackground: {
      background: theme.palette.surface[300],
    },

    rowHoverBackground: {
      '&:hover': {
        background: theme.palette.states.hover,
        [`& .${classes.watchlistControl}`]: {
          opacity: 100,
        },
      },
    },

    experienceTitle: {
      whiteSpace: 'nowrap',
    },

    watchlistControl: {
      opacity: 0,
      marginLeft: 0,
      transition: 'opacity 0.2s linear 0s',
    },

    watchlistControlCell: {
      paddingLeft: 0,
    },

    statsMargin: {
      marginTop: '4px',
    },

    statsItemMargin: {
      marginRight: '12px',
    },
  }),
);

export default useExperiencesTableRowStyles;
