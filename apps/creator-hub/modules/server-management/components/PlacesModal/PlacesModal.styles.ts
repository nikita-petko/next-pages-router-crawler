import { makeStyles } from '@rbx/ui';

const usePlacesModalStyles = makeStyles()((theme) => {
  return {
    modalContainer: {
      width: theme.spacing(47.25),
    },
    modalTitle: {
      padding: theme.spacing(2),
    },
    dialogContent: {
      maxHeight: theme.spacing(67.5),
      overflow: 'auto',
      padding: theme.spacing(2),
    },
    placesList: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1.5),
    },
    placeItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: theme.spacing(1.5),
      padding: theme.spacing(1),
    },
    placeAvatar: {
      width: theme.spacing(5),
      height: theme.spacing(5),
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '& img': {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: theme.shape.borderRadius,
      },
    },
    placeInfo: {
      flex: 1,
      minWidth: 0,
    },
    placeName: {
      display: 'block',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      maxWidth: '100%',
    },
    placeVersion: {
      display: 'block',
    },
    loadingIndicator: {
      textAlign: 'center',
      padding: theme.spacing(2),
    },
    dialogActions: {
      padding: theme.spacing(2),
    },
  };
});

export default usePlacesModalStyles;
