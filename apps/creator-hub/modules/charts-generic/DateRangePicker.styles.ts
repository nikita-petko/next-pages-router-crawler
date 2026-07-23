import { makeStyles } from '@rbx/ui';

const useDateRangePickerStyles = makeStyles()(() => {
  return {
    startEndPickerLayout: {
      display: 'flex',
      flexDirection: 'row',
      gap: '10px',
    },
  };
});

export default useDateRangePickerStyles;
