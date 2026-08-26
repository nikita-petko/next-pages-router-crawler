import { makeStyles } from '@rbx/ui';

const usePaymentActivityTabsStyles = makeStyles()(() => ({
  // A lone tab is presentational: there is nothing to switch to, so it does not
  // respond to pointer input.
  soloTab: {
    pointerEvents: 'none',
  },

  tabLabel: {
    alignItems: 'center',
    display: 'inline-flex',
    gap: 8,
  },

  // An `Inlined` trigger pads 4px above the label and 20px below it, so the
  // label sits 8px above the middle of the 48px tab while the hover state layer
  // still covers the full height. Matching the bottom padding to the top centers
  // the label without changing the tab's height. `&&` doubles the specificity so
  // this wins over Foundation's own padding utility regardless of the order the
  // two stylesheets happen to load in.
  verticallyCenteredTab: {
    '&&': {
      paddingBottom: 'var(--padding-xsmall)',
    },
  },
}));

export default usePaymentActivityTabsStyles;
