import { makeStyles } from '@rbx/ui';

const useCurrentOptimizationStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  actionButtonsContainer: {
    display: 'flex',
    justifyContent: 'end',
    gap: '12px',
  },
  headingGapSmall: {
    marginBottom: '8px',
  },
  textBox: {
    [theme.breakpoints.up(1440)]: {
      maxWidth: '960px',
    },
  },
  actionContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  priceCheckContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4px',
  },
  actionButton: {
    width: 'fit-content',
  },
  holdoutModalActions: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  holdoutApplyButtons: {
    display: 'flex',
    gap: '12px',
  },
  modalContentParagraphs: {
    whiteSpace: 'pre-wrap',
  },
}));

export default useCurrentOptimizationStyles;
