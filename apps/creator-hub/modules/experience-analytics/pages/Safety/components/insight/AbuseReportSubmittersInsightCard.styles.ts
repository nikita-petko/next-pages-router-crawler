import { makeStyles } from '@rbx/ui';

const useAbuseReportSubmittersInsightCardStyles = makeStyles()((theme) => {
  return {
    summaryContainer: {
      boxSizing: 'border-box',
      gap: theme.spacing(2),
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
    },
    iconContainer: {
      marginLeft: theme.spacing(3),
      marginTop: theme.spacing(3),
    },
    summaryTextContainer: {
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(2),
      marginRight: theme.spacing(3),
      minWidth: 0,
    },
    summaryText: {
      display: 'block',
    },
    summaryDescription: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
      wordBreak: 'break-word',
      whiteSpace: 'pre-wrap',
      display: 'block',
      maxWidth: '900px',
    },
  };
});

export default useAbuseReportSubmittersInsightCardStyles;
