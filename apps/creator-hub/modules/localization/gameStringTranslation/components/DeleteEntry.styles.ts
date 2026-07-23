import { makeStyles } from '@rbx/ui';

const maxHeightForAccordions = 540;

const useDeleteEntryStyles = makeStyles()((theme) => ({
  panel: {
    marginTop: theme.spacing(2),
  },

  sourceTextGrid: {
    marginTop: theme.spacing(2),
  },

  translationGrid: {
    width: '100%',
    borderRadius: theme.spacing(1 / 3),
    backgroundColor: theme.palette.media.secondaryBackground,
    padding: theme.spacing(2 / 3),
  },

  accordion: {
    '&:before': {
      // To eliminate the border between the accordions
      display: 'none',
    },
    overflow: 'hidden',
    backgroundColor: theme.palette.media.secondaryBackground,
  },

  accordionGrid: {
    marginTop: 20,
    maxHeight: maxHeightForAccordions,
    overflowY: 'auto',
  },
}));

export default useDeleteEntryStyles;
