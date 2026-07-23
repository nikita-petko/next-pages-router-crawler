import { makeStyles } from '@rbx/ui';

const useGenericSummaryInsightCardStyles = makeStyles()((theme) => {
  return {
    card: {
      boxSizing: 'border-box',
      gap: theme.spacing(2),
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
    },
    iconContainer: {
      marginLeft: theme.spacing(3),
      marginTop: theme.spacing(3),
    },
    contentContainer: {
      marginTop: theme.spacing(2.4),
      marginBottom: theme.spacing(3),
      marginRight: theme.spacing(3),
      minWidth: 0,
    },
    headerContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(1),
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
    },
    headerText: {
      display: 'block',
    },
    bodyContainer: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
      wordBreak: 'break-word',
      display: 'block',
      maxWidth: '900px',
      overflow: 'hidden',
    },
    bodyWithFade: {
      // Sourced from: https://stackoverflow.com/a/58740440
      '-webkit-mask-image': 'linear-gradient(to bottom, black 50%, transparent 100%)',
      'mask-image': 'linear-gradient(to bottom, black 50%, transparent 100%)',
    },
    footerContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing(2),
    },
    ctaButton: {
      marginRight: theme.spacing(1),
    },
  };
});

export default useGenericSummaryInsightCardStyles;
