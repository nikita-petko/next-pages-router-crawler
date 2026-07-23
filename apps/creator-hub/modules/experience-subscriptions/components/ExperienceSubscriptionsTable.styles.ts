import { makeStyles } from '@rbx/ui';

const useExperienceSubscriptionsTableStyles = makeStyles()(() => ({
  tableContainer: {
    overflowX: 'auto',
  },
  nameCell: {
    minWidth: 200,
    width: '25%',
  },
  statusCell: {
    minWidth: 130,
    width: '12%',
  },
  idCell: {
    minWidth: 240,
    width: '20%',
  },
  priceCell: {
    minWidth: 100,
    width: '12%',
  },
  regionalPricingCell: {
    minWidth: 145,
    width: '15%',
  },
  actionsCell: {
    minWidth: 48,
    width: '5%',
  },
}));

export default useExperienceSubscriptionsTableStyles;
