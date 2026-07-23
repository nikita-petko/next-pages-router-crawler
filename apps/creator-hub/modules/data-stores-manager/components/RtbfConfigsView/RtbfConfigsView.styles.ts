import { makeStyles } from '@rbx/ui';

const useRtbfConfigsViewStyles = makeStyles()(() => {
  return {
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 48,
    },
    pageContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 24,
      paddingTop: 16,
    },
    headerSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 4,
    },
    descriptionRow: {
      display: 'flex',
      gap: 4,
      alignItems: 'baseline',
    },
    learnMoreLink: {
      textDecoration: 'underline',
    },
    actionBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    patternText: {
      wordBreak: 'break-all' as const,
    },
    emptyStateCell: {
      padding: '48px 16px',
      borderBottom: 'none',
    },
    shrinkCell: {
      whiteSpace: 'nowrap' as const,
      width: 1,
      paddingRight: 24,
    },
    hoverRow: {
      '& .rtbf-action-icons': {
        opacity: 0,
        transition: 'opacity 0.2s ease-in-out',
      },
      '&:hover .rtbf-action-icons': {
        opacity: 1,
      },
    },
    actionButtons: {
      display: 'flex',
      gap: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
  };
});

export default useRtbfConfigsViewStyles;
