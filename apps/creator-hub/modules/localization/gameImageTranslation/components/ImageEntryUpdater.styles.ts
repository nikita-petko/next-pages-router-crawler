import { makeStyles } from '@rbx/ui';

const useImageEntryUpdaterStyles = makeStyles()((theme) => ({
  cardsRow: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },

  imageCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    background: theme.palette.surface[200],
  },

  imageCardMedia: {
    position: 'relative',
    width: '100%',
    aspectRatio: '2 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    backgroundColor: theme.palette.surface[400],
  },

  imageInCard: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },

  emptyMedia: {
    color: theme.palette.content.disabled,
    textAlign: 'center',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },

  imageCardFooter: {
    padding: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
  },

  cardTitle: {
    fontWeight: theme.typography.fontWeightBold,
  },

  cardTitleContainer: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'nowrap',
    marginBottom: theme.spacing(0.5),
    /** Match translated row with small IconButton; keeps footers aligned across cards. */
    minHeight: 30,
    boxSizing: 'border-box',
  },
}));

export default useImageEntryUpdaterStyles;
