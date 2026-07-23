import { makeStyles } from '@rbx/ui';

const useAccountActivityStyles = makeStyles()(() => {
  return {
    descriptionText: {
      marginTop: 8,
    },
    dateRangePickerContainer: {
      paddingTop: 16,
    },
    selectMenuContainer: {
      marginLeft: 12,
      width: 170,
    },
    customDateRangeConfirmButton: {
      marginTop: 16,
      float: 'right',
    },
  };
});

export default useAccountActivityStyles;
