import { makeStyles } from '@rbx/ui';

const useItemCardContainerStyles = makeStyles<void, 'moreButtonContainer'>()(
  (theme, _, classes) => ({
    hidden: {
      visibility: 'hidden',
    },

    link: {
      color: 'inherit',
      '&:hover': {
        textDecoration: 'none',
      },
    },

    moreButtonContainer: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 10,
    },

    privateEventContainer: {
      position: 'absolute',
      top: 100,
      left: 8,
      width: 'calc(100% - 16px)',
      zIndex: 10,
      backgroundColor: theme.palette.components.alert.noticeFill,
      borderRadius: 4,
    },

    moreIconButton: {
      marginLeft: 4,
    },

    itemCardContainer: {
      position: 'relative',
      cursor: 'pointer',
      [`&:hover .${classes.moreButtonContainer}`]: {
        visibility: 'initial',
      },
      [`&:focus-within .${classes.moreButtonContainer}`]: {
        visibility: 'initial',
      },
    },

    menuOpenedButton: {
      backgroundColor: theme.palette.actionV2.secondary.fill,
    },
  }),
);

export default useItemCardContainerStyles;
