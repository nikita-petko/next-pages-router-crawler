import { makeStyles } from '@rbx/ui';

const usePlacesManagementItemCardStyles = makeStyles()((theme) => ({
  itemCardContainer: {
    height: '100%',
    margin: '0px auto',
    paddingBottom: 16,
  },

  thumbnailImgStyles: {
    borderRadius: 4,
  },

  itemCardTitle: {
    marginTop: 4,
    maxWidth: '100%',
    '& > *': {
      display: 'block',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },
  },

  errorMessage: {
    color: theme.palette.error.main,
    marginLeft: 14,
    fontWeight: 'bold',
  },

  button: {
    marginTop: 18,
  },

  addedInfo: {
    fontWeight: 'bold',
    marginLeft: 4,
  },

  divStyle: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    color: theme.palette.success.main,
    marginTop: 22,
  },
}));

export default usePlacesManagementItemCardStyles;
