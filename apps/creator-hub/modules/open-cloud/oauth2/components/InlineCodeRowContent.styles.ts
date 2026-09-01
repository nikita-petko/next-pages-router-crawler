import { makeStyles } from '@rbx/ui';

const useInlineContentRowStyles = makeStyles()((theme) => ({
  rowLabel: {
    marginRight: 16,
    textAlign: 'left',
    fontWeight: 'bold',
  },

  dialogRowContentContainer: {
    marginBottom: 16,
  },

  dialogRowContentInlineCode: {
    width: 309, // value from Figma
    overflow: 'scroll',
    whiteSpace: 'nowrap',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    backgroundColor: theme.palette.media.toolbar,
    borderRadius: 4,
  },

  inlineCodeStyling: {
    display: 'block',
    backgroundColor: 'none',
  },

  secretStyling: {
    backgroundColor: 'none',
    userSelect: 'none',
  },

  dialogRowContentButtonsContainer: {
    width: 152, // arbitrary value, just need a container to hold the buttons so I can left align them
    textAlign: 'left',
    marginLeft: 8,
  },

  copyLabel: {
    marginLeft: 8,
  },

  labelContainer: {
    minWidth: 125, // arbitrary value, just need a container to hold the label content to left align them
  },
}));

export default useInlineContentRowStyles;
