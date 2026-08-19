import { makeStyles } from '@rbx/ui';

const useExperiencesStyles = makeStyles()((theme) => ({
  link: {
    color: theme.palette.content.action,
  },

  root: {
    overflow: 'hidden',
    position: 'relative',
  },

  heading: {
    marginBottom: 32,
  },

  experiencesContainer: {
    maxWidth: 1200,

    [theme.breakpoints.up('Small')]: {
      gap: 12,
    },

    [theme.breakpoints.up('Large')]: {
      gap: 16,
      '& > :nth-child(5)': {
        marginLeft: '60px',
      },
    },
    [theme.breakpoints.up('XLarge')]: {
      maxWidth: 1800,
    },
  },

  experienceContainer: {
    display: 'flex',
    position: 'relative',
    [theme.breakpoints.up('Medium')]: {
      flexBasis: 'calc(50% - 6px)',
    },
    [theme.breakpoints.up('Large')]: {
      flexBasis: 'calc(25% - 12px - 15px)',
    },
  },

  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 0,
    paddingBottom: '56%',
    overflow: 'hidden',
  },

  image: {
    top: 0,
    left: 0,
    position: 'absolute',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    border: '3px solid #0000004D',
    borderRadius: 8,
    boxShadow: '0px 4px 4px 0px #00000040',
    transition: 'all 350ms ease',
  },

  card: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'calc(100% - 30px)',
    opacity: 0,
    transition: 'all 200ms ease',
  },

  blur: {
    filter: 'blur(5px)',
  },

  show: {
    opacity: 1,
  },

  hoverContainer: {
    minWidth: 0,
  },

  hoverText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  hoverStat: {
    alignSelf: 'center',
    '& svg': {
      color: theme.palette.actionV2.primary.fill,
    },
  },
}));

export default useExperiencesStyles;
