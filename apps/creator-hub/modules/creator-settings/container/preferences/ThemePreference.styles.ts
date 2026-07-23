import { makeStyles, listItemClasses } from '@rbx/ui';

const useThemePreferenceContainerStyles = makeStyles()((theme) => ({
  title: {
    marginBottom: 24,
  },

  listButton: {
    marginBottom: 16,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '8px',
    borderColor: theme.palette.surface.outline,
    '&:hover': {
      borderColor: theme.palette.components.mediaButtons.outlined.hoverBorder,
      backgroundColor: 'transparent',
    },
    [`&.${listItemClasses.selected}, &.${listItemClasses.selected}:hover`]: {
      borderColor: theme.palette.components.mediaButtons.outlined.focusBorder,
      backgroundColor: 'transparent',
    },
  },

  themeList: {
    maxWidth: 750,
  },

  themeIcon: {
    width: 40,
    minWidth: 40,
  },

  themeTitle: {
    marginBottom: 0,
  },

  themeDescription: {
    paddingLeft: 40,
    marginTop: 0,
  },
}));

export default useThemePreferenceContainerStyles;
