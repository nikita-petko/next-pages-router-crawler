import { makeStyles } from '@rbx/ui';

const useSummaryPanelStyles = makeStyles()(() => ({
  header: {
    flexBasis: 585, // from figma - this value is the sum of the thumbnail section width + paddingRight
    flexShrink: 0,
  },

  permissionsPanel: {
    display: 'block',
  },

  firtAccordionPanel: {
    marginTop: 36,
  },

  accordionPanel: {
    marginTop: 24,
  },
}));

export default useSummaryPanelStyles;
