import { makeStyles } from '@rbx/ui';

const useContentTileStyles = makeStyles()((theme) => {
  const backgroundTransition = theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short,
  });
  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      borderRadius: '8px',
      width: '200px',
      height: '260px',
      transition: backgroundTransition,
      '&:hover': {
        position: 'relative',
        transition: backgroundTransition,
        backgroundColor: theme.palette.states.hover,
      },
    },
    contentNameLink: {
      display: 'block',
      textOverflow: 'ellipsis',
      width: '180px',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      color: theme.palette.content.standard,
    },
    contentCreatorLink: {
      display: 'block',
      textOverflow: 'ellipsis',
      width: '180px',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      color: theme.palette.content.standard,
    },
    card: {
      backgroundColor: 'transparent',
      width: '180px',
    },
    selectedCard: {
      backgroundColor: 'transparent',
      width: '180px',
      border: `2px solid ${theme.palette.content.standard}`,
    },
    image: {
      backgroundColor: theme.palette.surface[400],
      borderRadius: 8,
      width: '100%',
      transition: backgroundTransition,
    },
    thumbnail: {
      position: 'relative',
    },
    thumbnailImage: {
      display: 'block',
    },
  };
});

export default useContentTileStyles;
