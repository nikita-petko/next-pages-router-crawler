import { makeStyles } from '@rbx/ui';

const useInsightCardV2Styles = makeStyles()((theme) => {
  const cardPadding = 24;

  return {
    insightCardContainer: {
      background: theme.palette.surface[100],
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      padding: `${cardPadding}px ${cardPadding}px 0 ${cardPadding}px`,
    },
    headerContent: {
      width: '100%',
    },
    cardContent: {
      flexGrow: 1,
      padding: `8px ${cardPadding}px 0 ${cardPadding}px`,
      display: 'flex',
      flexDirection: 'column',
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
