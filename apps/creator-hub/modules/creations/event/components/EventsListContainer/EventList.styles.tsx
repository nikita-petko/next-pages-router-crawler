import { makeStyles } from '@rbx/ui';

const useEventListStyles = makeStyles()((theme) => ({
  listItemContainer: {
    '&:hover': {
      background: theme.palette.surface[200],
    },
  },

  mobileListItemContainer: {
    margin: 12,
  },

  nameContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    height: 56,
    width: '100%',
  },

  mobileNameContainer: {
    background: theme.palette.surface[200],
    gap: 12,
    borderRadius: 12,
    padding: 8,
    display: 'flex',
    alignItems: 'center',
  },

  mobileDetailsRow: {
    display: 'flex',
    flexDirection: 'row',
    padding: 8,
    justifyContent: 'space-between',
  },

  thumbnailContainer: {
    display: 'flex',
    flex: 'none',
    aspectRatio: '16 / 9',
    height: 56,
    minHeight: 56,
    backgroundColor: theme.palette.states.focus,
    borderRadius: 6,
  },

  mobileThumbnail: {
    display: 'flex',
    flex: 'none',
    height: 40.5,
    width: 72,
    backgroundColor: theme.palette.states.focus,
    borderRadius: 4,
  },

  buttonContainer: {
    display: 'flex',
    maxWidth: 'fit-content',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'right',
    gap: 12,
  },

  listFooterContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'end',
    margin: 6,
  },

  paginationButtonContainer: {
    display: 'flex',
    justifyContent: 'end',
    gap: 6,
  },

  metadataColumn: {
    maxWidth: '30lh',
    width: '30lh',
  },

  contextMenu: {
    gap: 16,
    [theme.breakpoints.down('Medium')]: {
      '& .MuiMenu-paper': {
        width: '100%',
      },
    },
  },

  primaryTableColumn: {
    width: '55%',
  },

  secondaryTableColumn: {
    width: '15%',
  },

  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 24,
    gap: 24,
    flexWrap: 'wrap',
  },
}));

export default useEventListStyles;
