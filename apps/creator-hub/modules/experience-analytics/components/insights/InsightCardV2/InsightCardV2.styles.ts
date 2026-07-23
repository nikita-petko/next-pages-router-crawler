import { makeStyles } from '@rbx/ui';

const useInsightCardV2Styles = makeStyles()(() => {
  return {
    insightCardContainer: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--color-surface-100)',
    },
    header: {
      padding: 'var(--padding-xlarge) var(--padding-xlarge) 0 var(--padding-xlarge)',
    },
    headerContent: {
      width: '100%',
    },
    cardContent: {
      flexGrow: 1,
      padding: '8px var(--padding-xlarge) 0 var(--padding-xlarge)',
      display: 'flex',
      flexDirection: 'column',
      '&:last-child': {
        paddingBottom: 'var(--padding-xlarge)',
      },
    },
    cardContentSideBySide: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    suggestionContainer: {
      marginTop: '16px',
    },
    suggestionContainerInColumn: {
      marginTop: '24px',
    },
    informationLeftColumn: {
      height: '100%',
    },
    columnSideBySide: {
      width: '50%',
    },
    insightCaptionContent: {
      verticalAlign: 'middle',
    },
    insightCardButton: {
      marginTop: '16px',
    },
  };
});

export default useInsightCardV2Styles;
