import { makeStyles } from '@rbx/ui';

const useDevexStyles = makeStyles()((theme) => ({
  root: {
    width: '100%',
    margin: 'auto',
  },

  noPadding: {
    padding: 0,
  },

  bulletListItem: {
    alignItems: 'flex-start',
    padding: theme.spacing(0.5, 1.5),
    '&::before': {
      color: theme.palette.text.secondary,
      content: '"\u{2022}"',
      fontSize: '28px',
      display: 'inline-block',
      marginLeft: '-1rem',
      marginRight: '0.5rem',
      lineHeight: '1em',
    },
  },
}));

export default useDevexStyles;
