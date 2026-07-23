import { makeStyles } from '@rbx/ui';

const useRtbfConfigDialogStyles = makeStyles()((theme) => {
  return {
    dialogContent: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 8,
      padding: 24,
      width: 600,
      boxSizing: 'border-box' as const,
    },
    heading: {
      marginBottom: 4,
    },
    fieldSpacing: {
      marginBottom: 8,
    },
    fieldLabel: {
      fontWeight: 500,
      marginBottom: 4,
    },
    userIdError: {
      paddingLeft: 14,
    },
    previewCard: {
      marginTop: 8,
      backgroundColor: theme.palette.states.hover,
    },
    previewCardContent: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 4,
      padding: 12,
      minHeight: 56,
      '&:last-child': {
        paddingBottom: 12,
      },
    },
    previewText: {
      overflowWrap: 'break-word' as const,
      wordBreak: 'break-all' as const,
    },
    buttonRow: {
      display: 'flex',
      gap: 8,
      justifyContent: 'flex-end',
      marginTop: 8,
    },
  };
});

export default useRtbfConfigDialogStyles;
