import { makeStyles } from '@rbx/ui';

const usePaymentActivityTabsStyles = makeStyles()(() => ({
  soloTab: {
    color: 'inherit',
    minHeight: 48,
    opacity: 1,
    pointerEvents: 'none',
    textTransform: 'none',
  },

  tab: {
    color: 'inherit',
    minHeight: 48,
    opacity: 1,
    textTransform: 'none',
  },

  tabLabel: {
    alignItems: 'center',
    display: 'inline-flex',
    gap: 8,
  },

  tabSelected: {
    color: 'inherit',
    minHeight: 48,
    opacity: 1,
    textTransform: 'none',
  },
}));

export default usePaymentActivityTabsStyles;
