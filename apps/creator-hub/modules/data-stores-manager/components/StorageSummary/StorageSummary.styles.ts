import { makeStyles } from '@rbx/ui';

const useStorageSummaryStyles = makeStyles()((theme) => {
  return {
    page: {
      paddingTop: 16,
      height: '100%',
    },
    storageCard: {
      marginBottom: 16,
      paddingRight: 16,
      paddingBottom: 8,
    },
    cardSize: {
      width: '100%',
      height: '100%',
      padding: 16,
    },
    errorCard: {
      width: '100%',
      height: '100%',
      padding: 16,
      borderColor: theme.palette.components.alert.importantFill,
      backgroundColor: theme.palette.components.alert.importantFill,
    },
    warningCard: {
      width: '100%',
      height: '100%',
      padding: 16,
      borderColor: theme.palette.components.alert.noticeFill,
      backgroundColor: theme.palette.components.alert.noticeFill,
    },
    alertContainer: {
      paddingBottom: 16,
    },
    storageLimitButton: {
      marginTop: -8,
    },
  };
});

export default useStorageSummaryStyles;
