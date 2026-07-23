import { makeStyles } from '@rbx/ui';
import { getChartThemedColors } from '../../charts/options';

const useGenericSummaryCardStyles = makeStyles()((theme) => ({
  card: {
    background: getChartThemedColors(theme).background,
  },
  cardContent: {
    padding: '20px 30px',
    '&:last-child': {
      paddingBottom: '20px',
    },
  },
  list: {
    padding: 0,
  },
  listItem: {
    padding: 0,
  },
}));

export default useGenericSummaryCardStyles;
