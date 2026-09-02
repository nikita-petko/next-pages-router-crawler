import { makeStyles } from '@rbx/ui';

const useLicenseFormStyles = makeStyles()(() => ({
  semanticGapLargerBottom: {
    marginBottom: 24,
  },
  semanticGapSmallTop: {
    marginTop: 8,
  },
  semanticMarginLargeBtm: {
    marginBottom: 32,
  },
  paddingMediumBtm: {
    paddingBottom: 12,
  },
  dropdownOption: {
    maxWidth: 640,
    textWrap: 'wrap',
  },
  accordion: {
    border: 'none',
    '&:before': {
      display: 'none',
    },
  },
  accordionSummary: {
    padding: 0,
    justifyContent: 'space-between',
    minHeight: 'auto',
    '& .MuiAccordionSummary-content': {
      margin: '8px 0',
    },
    '&.Mui-expanded': {
      minHeight: 'auto',
      '& .MuiAccordionSummary-content': {
        margin: '8px 0',
      },
    },
  },
  accordionDetails: {
    padding: 0,
    marginBottom: 24,
    display: 'flex',
    flexDirection: 'column',
  },
  contentStandardsButton: {
    alignSelf: 'flex-start',
  },
}));

export default useLicenseFormStyles;
