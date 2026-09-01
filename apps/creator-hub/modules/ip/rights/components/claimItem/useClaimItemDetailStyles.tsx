import { makeStyles } from '@rbx/ui';

const useClaimItemDetailStyles = makeStyles()((theme) => {
  return {
    container: {
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'flex-start',
    },
    border: {
      border: '2px solid white',
    },
    blankContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      width: '100%',
      height: 0,
      paddingBottom: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    link: {
      color: 'inherit',
      height: '50px',
      width: '100px',
      marginTop: '50%',
      marginLeft: '50%',
      marginRight: 'auto',
      transform: 'translate(-50%, -50%)',
    },
    image: {
      borderRadius: '8px',
    },
    releasedStatus: {
      backgroundColor: '#BBC2D11F',
      display: 'inline-flex',
      width: 'auto',
    },
    creationBlock: {
      minWidth: '0px',
    },
    truncated: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    contentContainer: {
      display: 'flex',
      borderRadius: '8px',
      width: '100%',
      height: '100%',
    },
    impactSection: {
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.16)',
      alignItems: 'center',
      padding: '16px',
      alignContent: 'flex-start',
    },
    thumbnail: {
      position: 'relative',
      width: '50px',
    },
    thumbnailImage: {
      display: 'block',
    },
    statusStyle: {
      display: 'inline-flex',
      width: 'auto',
    },
    selectedRow: {
      backgroundColor: 'rgba(187, 194, 209, 0.12)',
    },
    tableRow: {
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: theme.palette.actionV2.secondary.containedHoverFocus,
        color: theme.palette.actionV2.primary.containedHoverFocus,
      },
    },
    marginless: {
      marginTop: '0',
    },
    contentBlock: {
      overflow: 'hidden',
      justifyContent: 'center',
    },
    contentLink: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  };
});

export default useClaimItemDetailStyles;
