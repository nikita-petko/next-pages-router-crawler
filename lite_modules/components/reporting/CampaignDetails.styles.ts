import { makeStyles } from '@rbx/ui';

const useCampaignDetailsStyles = makeStyles()((theme) => ({
  container: {
    marginBottom: '32px',
    rowGap: '32px',
  },

  editRow: {
    justifyContent: 'space-between',
  },

  itemContainer: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    display: 'flex',
    gap: '8px',
  },

  labelContainer: {
    alignItems: 'center',
    display: 'flex',
    gap: '4px',
    minWidth: '80px',
  },

  labelFont: {
    color: theme.palette.content.muted,
    fontWeight: 400,
  },

  scheduleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  valueFont: {
    fontWeight: 500,
  },
}));

export default useCampaignDetailsStyles;
