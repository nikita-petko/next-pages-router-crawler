import { makeStyles } from '@rbx/ui';

const useBadgeListEntryStyles = makeStyles()(() => ({
  icon: {
    marginRight: 24,
    width: 50,
  },
  divider: {
    marginTop: 32,
    marginBottom: 32,
  },
  badgeNameTypography: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '50vw',
  },
}));

export default useBadgeListEntryStyles;
