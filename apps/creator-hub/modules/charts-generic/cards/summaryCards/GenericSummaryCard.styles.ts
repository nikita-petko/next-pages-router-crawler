import { makeStyles } from '@rbx/ui';
import { getChartThemedColors } from '../../charts/options';

const useGenericSummaryCardStyles = makeStyles()((theme) => {
  return {
    card: {
      background: getChartThemedColors(theme).background,
      maxWidth: '100%',
      boxSizing: 'border-box',
    },
    cardContent: {
      padding: '20px 24px',
      '&:last-child': {
        paddingBottom: '20px',
      },
    },
    // Title + optional header actions share one flex row so the label and
    // edit/overflow icons stay on the same horizontal center line.
    titleRow: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      minWidth: 0,
      width: '100%',
    },
    titleLabel: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
      flex: '1 1 auto',
    },
    headerActions: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
    },
    cardColumn: {
      minWidth: 0,
    },
    valueSlot: {
      paddingTop: 8,
      minHeight: theme.typography.h1.lineHeight,
      minWidth: 0,
      display: 'flex',
      alignItems: 'center',
      width: '100%',
    },
    gridItemFitContent: {
      width: 'fit-content',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
    },
    valueSlotFitContent: {
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      boxSizing: 'border-box',
    },
  };
});

export default useGenericSummaryCardStyles;
