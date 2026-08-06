import { makeStyles, treeItemClasses, typographyClasses, collapseClasses } from '@rbx/ui';
import { leftNavigationWidths, topNavigationHeights } from '../../layout/components/Layout.styles';
import useTopNavigationSidebarDrawer from '../../layout/hooks/useTopNavigationSidebarDrawer';

type Props = {
  hideBackButton: boolean;
  hideStatusDivider: boolean;
  hideSidebarHeaderText: boolean;
  newTreeViewStyle: boolean;
};

const useLeftNavigationStyles = makeStyles<Props>()(
  (theme, { hideBackButton, hideStatusDivider, hideSidebarHeaderText, newTreeViewStyle }) => ({
    root: {
      width: '100%',
      paddingLeft: 48,
      paddingTop: 48,
      paddingBottom: 48,
      paddingRight: 24,
      [theme.breakpoints.down('XLarge')]: {
        paddingLeft: 32,
        paddingTop: 32,
        paddingBottom: 32,
      },
      [theme.breakpoints.down('Large')]: {
        paddingLeft: 24,
        paddingTop: 24,
        paddingBottom: 24,
      },
    },

    section: {
      marginBottom: 12,
    },

    divider: {
      marginTop: 12,
      color: theme.palette.components.divider,
      display: hideStatusDivider ? 'none' : '',
    },

    name: {
      marginRight: 12,
      marginLeft: 12,
    },

    logoutButton: {
      marginBottom: 24,
    },

    sidebarHeaderText: {
      color: 'var(--color-content-default)',
      marginBottom: 12,
      display: hideSidebarHeaderText ? 'none' : '',
    },

    // Title/TitleLarge — section title
    sidebarSubHeaderText: {
      color: theme.palette.content.standard,
      marginBottom: 12,
      marginTop: newTreeViewStyle ? 12 : 32,
      fontSize: 16,
      fontWeight: 700,
      lineHeight: '140%',
    },

    treeViewRoot: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      [`& .${treeItemClasses.groupTransition}`]: {
        marginLeft: '0px',
        [`& .${treeItemClasses.content}`]: {
          paddingLeft: '24px',
        },
      },
      [`& .${collapseClasses.wrapperInner}`]: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      },
      // Focus alone must not look like the current page — expand/collapse categories
      // (Configure, Analytics, …) keep focus for a11y but without the selected fill.
      [`&& .${treeItemClasses.content}[data-focused]:not([data-selected])`]: {
        backgroundColor: 'transparent !important',
      },
      // Hover / active page: bg/shift-200. Include focused+hover so it beats the
      // focused-only reset above (higher specificity than :hover alone).
      [`&& .${treeItemClasses.content}:hover, && .${treeItemClasses.content}[data-focused]:not([data-selected]):hover, && .${treeItemClasses.content}[data-selected], && .${treeItemClasses.content}[data-selected][data-focused]`]:
        {
          backgroundColor: 'var(--color-shift-200) !important',
        },
      // Pressed + selected+hover: bg/shift-300. Use :active:hover (not bare :active)
      // so the press fill can't stick after expand/nav remounts until the next click.
      [`&& .${treeItemClasses.content}:active:hover, && .${treeItemClasses.content}[data-selected]:hover, && .${treeItemClasses.content}[data-selected][data-focused]:hover`]:
        {
          backgroundColor: 'var(--color-shift-300) !important',
        },
    },

    backButton: {
      paddingLeft: 0,
      marginBottom: 32,
      justifyContent: 'flex-start',
      color: theme.palette.actionV2.primary.fill,
      '&:hover': {
        backgroundColor: 'transparent',
      },
      display: hideBackButton ? 'none' : '',
      textTransform: newTreeViewStyle ? 'none' : 'uppercase',
    },

    backIcon: {
      marginRight: 8,
    },

    backTypography: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      textTransform: 'none',
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },

    list: {
      padding: 0,
    },

    loader: {
      marginBottom: 48,
    },

    // TODO(yanzhuang, CRF-3945): switch to use rbx/ui styles when new ListItem released
    treeItemContent: newTreeViewStyle
      ? {
          borderRadius: 8,
          padding: '0 12px',
          minHeight: '40px',
          alignItems: 'center',
          flexDirection: 'row-reverse',
          [`.${treeItemClasses.groupTransition} & .${treeItemClasses.label}`]: {
            ...theme.typography.body2,
            color: 'var(--color-content-default)',
          },
          [`.${treeItemClasses.groupTransition} &[data-selected] .${treeItemClasses.label}`]: {
            color: 'var(--color-content-default)',
          },
          [`& .${treeItemClasses.iconContainer}`]: {
            width: 0,
            color: 'var(--color-content-default)',
          },
          [`& .${treeItemClasses.label}`]: {
            width: '100%',
            flex: 1,
            minWidth: 0,
          },
        }
      : {
          padding: 4,
          transform: 'translate(-4px)',
          [`& .${treeItemClasses.iconContainer}`]: {
            width: 0,
            marginLeft: 0,
            marginRight: 0,
          },
          [`& .${treeItemClasses.label}`]: {
            padding: 0,
          },
        },
    treeParentItemContent: newTreeViewStyle
      ? {
          borderRadius: 8,
          padding: '0 12px',
          minHeight: '40px',
          alignItems: 'center',
          flexDirection: 'row-reverse',
          // Label/LabelMedium — categories
          [`& .${treeItemClasses.label} .${typographyClasses.root}`]: {
            fontSize: 14,
            fontWeight: 600,
            lineHeight: '14px',
          },
          // Body/BodyMedium — subcategories nested under a category
          [`.${treeItemClasses.groupTransition} & .${treeItemClasses.label} .${typographyClasses.root}`]:
            {
              ...theme.typography.body2,
            },
          [`& .${treeItemClasses.iconContainer} svg`]: {
            fontSize: '1.5rem',
          },
          [`& .${treeItemClasses.label}`]: {
            width: '100%',
            flex: 1,
            minWidth: 0,
          },
        }
      : {
          padding: 4,
          transform: 'translate(-4px)',
          [`& .${treeItemClasses.label}`]: {
            padding: 0,
          },
        },

    leftNav: {
      position: 'fixed',
      width: leftNavigationWidths.large,
      [theme.breakpoints.down('Medium')]: {
        width: leftNavigationWidths.compact,
      },
      top: topNavigationHeights.large,
      bottom: 0,
      overflowY: 'auto',
      backgroundColor: theme.palette.navigation.default,
    },

    containerDivider: {
      position: 'fixed',
      left: leftNavigationWidths.large,
      color: theme.palette.components.divider,
    },

    statusName: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      color: theme.palette.states.disabled,
      textTransform: 'none',
    },

    statusContainer: {
      width: 'inherit',
      justifyContent: 'flex-start',
      padding: '6px 8px',
    },

    statusListItem: {
      paddingTop: 0,
      paddingBottom: 0,
    },

    sidebarLink: {
      color: newTreeViewStyle
        ? theme.palette.content.standard
        : theme.palette.actionV2.primary.fill,
      '&:hover': {
        textDecoration: 'none',
      },
    },
  }),
);

const useLeftNavigationStylesWrapper = () => {
  const { insideTopNavigationDrawer } = useTopNavigationSidebarDrawer();
  return useLeftNavigationStyles({
    hideBackButton: insideTopNavigationDrawer,
    hideStatusDivider: true,
    hideSidebarHeaderText: true,
    newTreeViewStyle: true,
  });
};

export default useLeftNavigationStylesWrapper;
