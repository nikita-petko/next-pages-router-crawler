import { makeStyles } from '@rbx/ui';

const useExperienceSubscriptionsHistoryTableStyles = makeStyles()(() => ({
  tableContainer: {
    overflowX: 'auto',
  },
  nameCell: {
    minWidth: 200,
    width: '25%',
    fontWeight: 'bold',
  },
  dateCell: {
    minWidth: 130,
    width: '15%',
    fontWeight: 'bold',
  },
  statusCell: {
    minWidth: 100,
    width: '12%',
    fontWeight: 'bold',
  },
  priceCell: {
    minWidth: 100,
    width: '12%',
    fontWeight: 'bold',
  },
  subscriptionsCell: {
    minWidth: 140,
    width: '18%',
    fontWeight: 'bold',
  },
  revenueCell: {
    minWidth: 140,
    width: '18%',
    fontWeight: 'bold',
  },
  revenueContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  tooltipIcon: {
    display: 'inline-flex',
    verticalAlign: 'middle',
    marginLeft: '4px',
  },
}));

export default useExperienceSubscriptionsHistoryTableStyles;
