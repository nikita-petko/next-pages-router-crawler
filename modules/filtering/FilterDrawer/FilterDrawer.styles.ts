// Adapted from creator-hub: https://github.rbx.com/Roblox/creator-hub/blob/master/apps/creator-hub/modules/charts-generic/components/FilterDrawer/FilterDrawer.styles.ts

import { makeStyles, TTheme } from '@rbx/ui';

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
  const drawerRootZIndex = theme.zIndex.modal + 1;
  const dropdownMenuZIndex = drawerRootZIndex + 1;

  return {
    choiceContainer: {
      '&  .MuiFormControl-root': {
        maxWidth: '100%',
      },
      marginBottom: '8px',
      padding: theme.spacing('8px', 0),
    },
    choiceHeader: {
      padding: '8px 0',
    },
    choiceLoadingCircularSpinner: {
      marginLeft: '8px',
    },
    choiceOptionControl: {
      height: '24px',
      margin: '4px 8px 4px 16px',
      width: '24px',
    },
    choiceOptionLabel: {
      width: `${filterDrawerEnumChoiceStyle.choiceMaxWidth}px`,
    },
    choiceOptionLabelTypography: {
      maxWidth: `${filterDrawerEnumChoiceStyle.choiceMaxWidth}px`,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      width: 'fit-content',
    },
    drawerButton: {
      flexGrow: 1,
    },
    drawerContainer: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: 0,
    },
    drawerContent: {
      display: 'block',
      flexGrow: 1,
      marginTop: '24px',
      overflowX: 'hidden',
      overflowY: 'auto',
      padding: `0 ${drawerContentHorizontalPadding}px`,
    },
    drawerFiltersColumn: {
      maxWidth: `${(drawerWidth - 2 * drawerContentHorizontalPadding) / 2}px`,
    },
    drawerFooter: {
      borderTop: `1px solid ${theme.palette.surface[400]}`,
      justifyContent: 'space-between',
      padding: theme.spacing('24px', '40px'),
    },
    drawerPaper: {
      border: 'unset',
      height: `calc(100% - ${navBarHeight + 2 * verticalMargin}px)`,
      margin: theme.spacing(
        `${navBarHeight + verticalMargin}px`,
        `${horizontalMargin}px`,
        `${verticalMargin}px`,
      ),
      // max width cannot go beyond 100% - 2 * horizontal margin
      width: `min(calc(100% - ${2 * horizontalMargin}px), ${drawerWidth}px)`,
      ...theme.border.radius.medium,
      boxShadow: theme.elevation.overlay,
    },
    drawerRoot: {
      zIndex: drawerRootZIndex,
    },
    drawerSecondRow: {
      marginTop: '24px',
      padding: theme.spacing(0, '40px'),
    },
    drawerTitle: {
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '32px',
      padding: theme.spacing(0, '40px'),
    },
    dropdownLoadingCircular: {
      position: 'absolute',
      right: '32px',
    },
    dropdownMenuPaper: {
      maxHeight: '300px',
    },
    dropdownMenuRoot: {
      zIndex: dropdownMenuZIndex,
    },
    filterLoadingCircularSpinner: {
      marginLeft: 4,
    },
    filterRefreshButton: {
      marginLeft: 8,
      minHeight: 44,
      minWidth: 0,
      paddingLeft: '12px',
      paddingRight: '12px',
    },
    groupContainer: {
      marginBottom: '8px',
    },
    groupContent: {
      maxWidth: '100%',
    },
    groupDivider: {
      marginBottom: '16px',
    },
    groupHeader: {
      padding: '8px 0',
    },
    spacer: {
      width: '16px',
    },
    tooltip: {
      '@supports (display: -webkit-box)': {
        display: '-webkit-box',
      },
      boxOrient: 'vertical',
      lineClamp: 5,
      position: 'relative',
      textOverflow: 'ellipsis',
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: 5,
    },
  };
});
export default useFilterDrawerStyles;

export const useFilterDrawerMenuPropsClasses = () /* MenuProps['classes'] */ => {
  const {
    classes: { dropdownMenuPaper, dropdownMenuRoot },
  } = useFilterDrawerStyles();
  return { paper: dropdownMenuPaper, root: dropdownMenuRoot };
};
