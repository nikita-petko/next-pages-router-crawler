import { makeStyles } from '@rbx/ui';

const useLabeledDateRangeSelectorStyles = makeStyles()(() => ({
  dateRangeSelect: {
    width: 350,
  },
  dateRangeSelectorContainer: {
    padding: '24px 0px 16px 0px',
    gap: 16,
  },
  dateRangeSelectorListbox: {
    overflow: 'clip',
    maxHeight: '100%',
  },
  dateRangeSelectPopperEventContainer: {
    maxHeight: '9lh',
    overflowY: 'auto',
  },
  dateRangeSelectPopperCustomRangeContainer: {
    display: 'flex',
    flexDirection: 'column',
    padding: 12,
    gap: 8,
  },
}));

export default useLabeledDateRangeSelectorStyles;
