import { makeStyles } from '@rbx/ui';

const useScorecardButtonsStyles = makeStyles()({
  scorecardButtonsContainer: {
    display: 'flex',
    gap: '16px',
  },
  dialogTitle: {
    padding: '32px 32px 16px 32px',
  },
  dialogContent: {
    padding: '0 32px 12px 32px',
  },
  dialogActions: {
    padding: '24px 32px 32px 32px',
  },
});

export default useScorecardButtonsStyles;
