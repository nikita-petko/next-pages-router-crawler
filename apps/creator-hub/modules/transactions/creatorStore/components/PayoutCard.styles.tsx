import { makeStyles } from '@rbx/ui';

const usePayoutCardStyles = makeStyles()(() => ({
  cardContainer: {
    minWidth: '270px',
    padding: '4px 16px',
  },

  subheader: {
    paddingBottom: '8px',
    paddingTop: '4px',
  },
}));

export default usePayoutCardStyles;
