import { makeStyles } from '@rbx/ui';

const useTimelineModalStyles = makeStyles()({
  tableContainer: {
    marginTop: '32px',
  },
  tooltipCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  footer: {
    display: 'inline-block',
    marginTop: '12px',
  },
  boldCell: {
    fontWeight: 'bold',
  },
});

export default useTimelineModalStyles;
