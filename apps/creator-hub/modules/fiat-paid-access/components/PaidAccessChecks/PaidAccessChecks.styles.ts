import { makeStyles } from '@rbx/ui';

const usePaidAccessChecksStyles = makeStyles()((theme) => ({
  cardContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    background: theme.palette.surface[200],
    borderRadius: '8px',
    paddingRight: '16px',
    paddingBottom: '16px',
    margin: 0,
  },
  eligibilityContainer: {
    paddingLeft: '16px',
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  subheaderText: {
    color: theme.palette.content.muted,
  },
}));

export default usePaidAccessChecksStyles;
