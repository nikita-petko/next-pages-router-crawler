import { makeStyles } from '@rbx/ui';

const useAccountActivityFilterStyles = makeStyles()(() => {
  return {
    dateRangePickerContainer: {
      paddingTop: 16,
    },
    filterContainer: {
      gap: 12,
    },
    selectMenuContainer: {
      width: 170,
    },
    customDateRangeConfirmButton: {
      marginTop: 16,
      float: 'right',
    },
  };
});

export default useAccountActivityFilterStyles;
