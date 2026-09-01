import { makeStyles } from '@rbx/ui';

const groupRoleListWidth = 492;
const groupRoleItemMaxHeight = 260;
const groupRoleItemScrollbarWidth = 6;

const useTranslatorGroupRoleSelectionMenuStyles = makeStyles()((theme) => ({
  selectRoleLabel: {
    margin: theme.spacing(2, 0, 20, 0),
  },

  selectedRoleContainer: {
    width: '100%',
    marginTop: 10,
  },

  groupRoleList: {
    width: `${groupRoleListWidth}px`,
    '& ul': {
      paddingTop: theme.spacing(0),
      paddingBottom: theme.spacing(0),
    },
  },

  groupRoleItem: {
    lineHeight: '2.5em',
    textOverflow: 'ellipsis',
  },

  groupRoleItemContainer: {
    maxHeight: `${groupRoleItemMaxHeight}px`,
    width: '100%',
    overflowY: 'auto',
    scrollbarColor: `${theme.palette.media.secondaryBackground} transparent`,
    scrollbarWidth: 'thin',
    '&::-webkit-scrollbar': {
      width: `${groupRoleItemScrollbarWidth}px`,
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.media.secondaryBackground,
      borderRadius: '10rem',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
  },

  divider: {
    borderBottom: `1px solid ${theme.palette.outlineBorder}`,
  },
}));

export default useTranslatorGroupRoleSelectionMenuStyles;
