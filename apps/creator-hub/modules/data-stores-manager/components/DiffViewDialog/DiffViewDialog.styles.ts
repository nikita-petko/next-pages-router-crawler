import { makeStyles } from '@rbx/ui';

const useDiffViewDialogStyles = makeStyles()((theme) => {
  return {
    lineNumber: {
      marginLeft: -4,
      textAlign: 'left',
      minWidth: '20px',
      color: theme.palette.content.standard,
      userSelect: 'none',
      fontFamily: 'Builder Mono',
      fontSize: 14,
      fontWeight: 25,
      opacity: '80%',
    },
    lineContent: {
      flex: 1,
      paddingLeft: 8,
      paddingRight: 8,
      fontFamily: 'Builder Mono',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      opacity: 1,
      display: 'block',
      width: '100%',
    },
    added: {
      backgroundColor: theme.palette.components.alert.activeFill,
      opacity: 0.75,
    },
    removed: {
      backgroundColor: '#F45B524D', // Light red background for removed
      opacity: 0.75,
    },
    intermediateContent: {
      fontSize: 10, // Font size for the + and - symbols
      textAlign: 'left',
      paddingRight: 4,
      paddingLeft: 4,
      userSelect: 'none',
      borderRight: `1px solid ${theme.palette.components.divider}`,
    },
    intermediateContentAdded: {
      color: theme.palette.content.standard,
    },
    valueTypography: {
      marginTop: 8,
      paddingBottom: 4,
    },
    versionSelect: {
      '& .MuiSelect-select': {
        fontSize: '0.75rem',
        padding: '2px 8px',
        display: 'flex',
        alignItems: 'center',
        scrollbarWidth: 'thin',
      },
      '& .MuiOutlinedInput-root': {
        fontSize: '0.75rem',
        minHeight: '32px',
        maxHeight: '32px',
        scrollbarWidth: 'thin',
      },
    },
    cardContainer: {
      position: 'relative',
      border: '1px solid ',
      borderRadius: 5,
      borderColor: theme.palette.states.hover,
      backgroundColor: theme.palette.surface[200],
      height: 250,
      overflow: 'auto',
      scrollbarWidth: 'thin',
    },
    metadataCardContainer: {
      position: 'relative',
      border: '1px solid ',
      borderRadius: 5,
      borderColor: theme.palette.states.hover,
      backgroundColor: theme.palette.surface[200],
      height: 120,
      overflow: 'auto',
      scrollbarWidth: 'thin',
    },
    dialogContainer: {
      '& .MuiDialog-paper': {
        backgroundColor: theme.palette.surface[100],
      },
    },
    dialogTitle: {
      paddingBottom: 16,
    },
    versionList: {
      fontSize: '0.75rem',
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 2,
      paddingRight: 2,
    },
  };
});

export default useDiffViewDialogStyles;
