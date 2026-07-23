import { makeStyles } from '@rbx/ui';

const useEntryValueViewStyles = makeStyles()((theme) => {
  return {
    copyButton: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    button: {
      fontSize: 12,
      padding: 2,
      minHeight: 25,
    },
    cardContentContainer: {
      minHeight: 300,
      maxHeight: 500,
      padding: 8,
    },
    metaDataCardContentContainer: {
      minHeight: 150,
      maxHeight: 300,
      padding: 8,
    },
    cardContainer: {
      position: 'relative',
      border: '1px solid ',
      borderRadius: 4,
      borderColor: theme.palette.states.hover,
      minHeight: 300,
      maxHeight: 500,
      overflow: 'auto',
      scrollbarWidth: 'thin',
    },
    metadataCardContainer: {
      position: 'relative',
      border: '1px solid ',
      borderRadius: 4,
      borderColor: theme.palette.states.hover,
      minHeight: 150,
      maxHeight: 250,
      overflow: 'auto',
      scrollbarWidth: 'thin',
    },
    emptyValueText: {
      fontFamily: 'Builder Mono',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
  };
});

export default useEntryValueViewStyles;
