import { makeStyles } from '@rbx/ui';

const useGenericTableCellWithTooltipStyles = makeStyles()((theme) => ({
  tooltipContentStyle: {
    verticalAlign: 'top',
    marginRight: theme.spacing(0.5),
    ...theme.typography.tableHead,
  },
  tooltipIcon: {
    display: 'flex',
    alignItems: 'center',
  },
}));

export default useGenericTableCellWithTooltipStyles;
