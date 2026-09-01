import { makeStyles } from '@rbx/ui';

const inviteMenuItemWidth = 240;
const inviteMenuItemHeight = 56;
const selectedItemContainerMinHeight = 69;

const useTranslatorAdderStyles = makeStyles()((theme) => ({
  inviteMenu: {
    '& ul': {
      padding: '0px',
    },
  },

  inviteMenuItem: {
    lineHeight: '1.4em',
    width: `${inviteMenuItemWidth}px`,
    height: `${inviteMenuItemHeight}px`,
  },

  selectedItemContainer: {
    minHeight: `${selectedItemContainerMinHeight}px`,
    margin: theme.spacing(2, 0),
  },

  selectedItemList: {
    padding: '0px',
    width: '100%',
  },

  selectedItem: {
    backgroundColor: theme.palette.media.secondaryBackground,
    borderRadius: `${theme.shape.borderRadius}px`,
    margin: theme.spacing(1, 0),
  },

  searchDialogContainer: {
    overflow: 'hidden',
  },

  searchLoading: {
    width: '100%',
    padding: theme.spacing(2),
    textAlign: 'center',
  },

  searchErrorMsg: {
    margin: theme.spacing(0.5, 0.8, -0.25, 0),
  },
}));

export default useTranslatorAdderStyles;
