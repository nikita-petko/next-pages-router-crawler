import { makeStyles } from '@rbx/ui';

const useRecommendedEventsLiveEventsTableDialogStyles = makeStyles()(() => ({
  dialogContent: {
    paddingTop: '24px',
    overflowX: 'auto',
  },
  tableMaxHeight: {
    // NOTE(shumingxu, 04/10/2024): We want to limit the height of the table to always show the CTA buttons.
    // We use vh instead of px to make it responsive to the screen height.
    maxHeight: '50vh',
  },
}));

export default useRecommendedEventsLiveEventsTableDialogStyles;
