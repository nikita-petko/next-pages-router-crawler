import { makeStyles } from '@rbx/ui';

const useMenuStyles = (itemCount: number) =>
  makeStyles()((theme) => ({
    submenu: {
      marginTop: 8,
    },

    menuTab: {
      minWidth: `${Math.round((itemCount * 100) / 4) / 100}%`,
    },

    chipContainer: {
      minWidth: 0,
      padding: 4,
    },

    filtersContainer: {
      // Same height as tabs
      minHeight: '48px',
      [theme.breakpoints.down('Medium')]: {
        padding: 8,
      },
    },

    filtersDivider: {
      marginTop: 8,
    },
  }));

export default useMenuStyles;
