import { makeStyles } from '@rbx/ui';

const useRestartFilterDetailsStyles = makeStyles()(() => ({
  accordionSummary: {
    '& .MuiAccordionSummary-content.Mui-expanded': {
      marginBottom: 0,
    },
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      marginTop: 22,
    },
  },
  accordionDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    paddingTop: 0,
    maxHeight: 500,
    overflow: 'auto',
  },
  placesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 12,
  },
  placeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  placeIcon: {
    width: 32,
    height: 32,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '& img': {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: 4,
    },
  },
}));

export default useRestartFilterDetailsStyles;
