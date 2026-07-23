import type { TTheme } from '@rbx/ui';
import { makeStyles } from '@rbx/ui';

export const filterDrawerEnumChoiceStyle = {
  choiceMaxWidth: 150,
};

const useFilterDrawerStyles = makeStyles()((theme: TTheme) => {
  const verticalMargin = 16;
  const horizontalMargin = 22;
  const navBarHeight = 60; // match app top nav bar height
  const drawerContentHorizontalPadding = 40;
  const drawerWidth = 451;

  /** Needs to stay on top of the explore mode dialog */
  const drawerPaperZIndex = theme.zIndex.modal + 1;
  const dropdownMenuZIndex = drawerPaperZIndex + 1;

  return {
    drawerPaper: {
      margin: theme.spacing(
        `${navBarHeight + verticalMargin}px`,
        `${horizontalMargin}px`,
        `${verticalMargin}px`,
      ),
      height: `calc(100% - ${navBarHeight + 2 * verticalMargin}px)`,
      // max width cannot go beyond 100% - 2 * horizontal margin
      width: `min(calc(100% - ${2 * horizontalMargin}px), ${drawerWidth}px)`,
      border: 'unset',
      ...theme.border.radius.medium,
      boxShadow: theme.elevation.overlay,
      zIndex: drawerPaperZIndex,
    },
    drawerContainer: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
    },
    drawerTitle: {
      marginTop: '32px',
      padding: theme.spacing(0, '40px'),
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    drawerContent: {
      display: 'block',
      flexGrow: 1,
      marginTop: '24px',
      padding: `0 ${drawerContentHorizontalPadding}px`,
      overflowY: 'auto',
      overflowX: 'hidden',
    },
    drawerFiltersColumn: {
      maxWidth: `${(drawerWidth - 2 * drawerContentHorizontalPadding) / 2}px`,
    },
    drawerFooter: {
      borderTop: `1px solid ${theme.palette.surface[400]}`,
      padding: theme.spacing('24px', '40px'),
    },
    groupContainer: {
      marginBottom: '8px',
    },
    groupHeader: {
      padding: '8px 0',
    },
    groupContent: {
      maxWidth: '100%',
    },
    choiceHeader: {
      padding: '8px 0',
    },
    choiceContainer: {
      padding: theme.spacing('8px', 0),
      marginBottom: '8px',
      '&  .MuiFormControl-root': {
        maxWidth: '100%',
      },
    },
    choiceOptionControl: {
      margin: '4px 8px 4px 16px',
      width: '24px',
      height: '24px',
    },
    choiceOptionLabel: {
      width: `${filterDrawerEnumChoiceStyle.choiceMaxWidth}px`,
    },
    choiceOptionLabelTypography: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      width: 'fit-content',
      maxWidth: `${filterDrawerEnumChoiceStyle.choiceMaxWidth}px`,
    },
    choiceLoadingCircularSpinner: {
      marginLeft: '8px',
    },
    choiceInfoIcon: {
      marginLeft: '8px',
    },
    dropdownMenuPaper: {
      maxHeight: '300px',
    },
    dropdownMenuRoot: {
      zIndex: dropdownMenuZIndex,
    },
    dropdownLoadingCircular: {
      position: 'absolute',
      right: '32px',
    },
    tooltip: {
      lineClamp: 5,
      WebkitLineClamp: 5,
      boxOrient: 'vertical',
      WebkitBoxOrient: 'vertical',
      '@supports (display: -webkit-box)': {
        display: '-webkit-box',
      },
      textOverflow: 'ellipsis',
      position: 'relative',
    },
  };
});
export default useFilterDrawerStyles;

export const useFilterDrawerMenuPropsClasses = () /* MenuProps['classes'] */ => {
  const {
    classes: { dropdownMenuRoot, dropdownMenuPaper },
  } = useFilterDrawerStyles();
  return { paper: dropdownMenuPaper, root: dropdownMenuRoot };
};
