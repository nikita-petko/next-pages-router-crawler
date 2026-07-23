import { makeStyles } from '@rbx/ui';

const translatorDeletingItemHeight = 72;

const useLocalizationTranslatorsContainerStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    height: '100%',
  },

  rowMenu: {
    width: '100%',
    alignContent: 'center',
    margin: theme.spacing(0, 0, 2, 0),
  },

  userChip: {
    margin: theme.spacing(0, 1, 0, 0),
  },

  translatorList: {
    paddingTop: '0px',
  },

  translatorListItem: {
    backgroundColor: theme.palette.media.secondaryBackground,
    marginBottom: theme.spacing(1),
  },

  translatorDeletingItem: {
    height: `${translatorDeletingItemHeight}px`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

export default useLocalizationTranslatorsContainerStyles;
