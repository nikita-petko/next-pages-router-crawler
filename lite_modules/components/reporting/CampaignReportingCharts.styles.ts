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

  // Foundation's TabsTrigger locks the button and its inner content wrapper to
  // fixed single-line heights. ChartSummary is a two-line description-over-value
  // block, so both need to grow to avoid clipping the top of the label.
  metricTab: {
    '&&': {
      height: 'auto',
    },
    '&& > div:last-child': {
      height: 'auto',
    },
  },

  // TabsList passes `className` to its scroll wrapper, not to the element that
  // lays the triggers out, so a gap utility handed to the component never
  // reaches a flex container. Triggers also carry no horizontal padding in the
  // default `Fit` behavior, which leaves the two metric labels touching. The
  // gap has to go between the triggers rather than inside them so the first
  // label stays flush with the section heading above it.
  metricTabList: {
    '& > [role="tablist"]': {
      gap: theme.spacing(1.5),
    },
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
