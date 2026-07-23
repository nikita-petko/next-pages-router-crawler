import { accordionSummaryClasses, makeStyles } from '@rbx/ui';

const useCookiesAccordionStyles = makeStyles()(() => ({
  accordionSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    [`& .${accordionSummaryClasses.content}`]: {
      margin: 0,
      '&.Mui-expanded': {
        margin: 0,
      },
    },
    '&.Mui-expanded': {
      minHeight: '48px',
    },
  },
  accordion: {
    '&::before': {
      height: 0,
    },
    '&.Mui-expanded': {
      margin: 0,
    },
  },
}));

export default useCookiesAccordionStyles;
