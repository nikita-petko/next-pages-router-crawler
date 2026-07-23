import { makeStyles } from '@rbx/ui';
import styles from './utils/styles';

const endAdornmentWidth = 24 + 8; // 24px for the icon, 8px for the margin

const useSearchListItemStyles = makeStyles<{
  isSecondaryActionNonInteractive?: boolean;
}>()((theme, props) => {
  return {
    listItem: {
      fontSize: 14,
      padding: '10px 16px',
      color: theme.palette.content.muted,
      cursor: 'pointer',
      lineHeight: 1.4,
      transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms', // consistent with IconButton
      '-webkit-tap-highlight-color': theme.palette.states.hover,
      '&:hover, &.Mui-selected, &.Mui-focusVisible, &:focus, &:active': {
        backgroundColor: theme.palette.states.hover,
      },
    },
    listItemIcon: {
      color: 'inherit',
      minWidth: 0,
      width: 44,
    },
    iconContainer: {
      width: 28,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    listItemText: {
      margin: 0,
    },
    listItemPrimaryText: {
      display: 'flex',
      alignItems: 'center',
      margin: 0,
      lineHeight: 1.4,
      maxWidth: `calc(100% - ${endAdornmentWidth}px)`,
    },
    listItemPrimaryTextFlow: {
      margin: 0,
      lineHeight: 1.4,
      maxWidth: `calc(100% - ${endAdornmentWidth}px)`,
      ...styles.textClamp(1),
    },
    listItemTitle: {
      maxWidth: `calc(100% - ${endAdornmentWidth}px)`,
      display: 'inline-block',
      verticalAlign: 'middle',
      ...styles.textClamp(1),
    },
    listItemTitleInline: {
      display: 'inline',
    },
    listItemDescription: {
      color: theme.palette.content.muted,
      maxWidth: `calc(100% - ${endAdornmentWidth}px)`,
      display: 'inline-block',
      verticalAlign: 'middle',
      ...styles.textClamp(1),
    },
    listItemLabel: {
      fontSize: 12,
      marginLeft: 8,
      display: 'inline-block',
      verticalAlign: 'middle',
      lineHeight: '20px',
      maxWidth: `calc(100% - ${endAdornmentWidth}px)`,
      ...styles.textClamp(1),
    },
    listItemLabelInline: {
      fontSize: 12,
      marginLeft: 8,
      display: 'inline',
      lineHeight: '20px',
    },
    listItemSecondaryAction: {
      color: theme.palette.content.muted,
      lineHeight: 0,
      pointerEvents: props.isSecondaryActionNonInteractive ? 'none' : 'auto',
    },
    titleAdornmentWrapper: {
      flex: 1,
      marginLeft: 8,
      display: 'inline-block',
      position: 'relative',
      '& .MuiChip-root': {
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 10, 0.2)' : '',
        color: theme.palette.mode === 'dark' ? '' : theme.palette.content.muted,
      },
    },
    titleAdornment: {
      position: 'absolute',
      top: 'calc(-1lh + 2px)',
      left: 0,
    },
  };
});

export default useSearchListItemStyles;
