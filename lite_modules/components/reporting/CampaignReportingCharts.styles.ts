import { makeStyles } from '@rbx/ui';

const useCampaignReportingChartsStyles = makeStyles()((theme) => ({
  chartWrapper: {
    minHeight: theme.spacing(30),
  },

  container: {
    backgroundColor: theme.palette.surface[0],
    borderRadius: theme.border.radius.medium.borderRadius,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(4),
    padding: theme.spacing(3),
  },

  controlsLeft: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    gap: theme.spacing(2),
    minWidth: 0,
  },

  controlsRow: {
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'space-between',
  },

  errorText: {
    color: theme.palette.content.muted,
  },

  metricDisplay: {
    alignSelf: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    margin: 0,
    padding: 0,
  },

  metricTab: {
    '&&': {
      height: theme.spacing(8),
      minHeight: theme.spacing(8),
      padding: theme.spacing(0.5, 0),
    },
    '&& > div:last-child': {
      alignSelf: 'flex-start',
      height: 'auto',
    },
    margin: 0,
  },

  metricValue: {
    textAlign: 'left',
  },

  periodSelect: {
    marginLeft: 'auto',
    minWidth: theme.spacing(20),
  },

  titleRow: {
    alignItems: 'center',
    display: 'flex',
  },
}));

export default useCampaignReportingChartsStyles;
