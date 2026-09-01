import { makeStyles } from '@rbx/ui';

type InputFieldWrapperStyleProps = {
  error: boolean;
};

// Values taken directly from MUI
const useInputFieldWrapperStyles = makeStyles<InputFieldWrapperStyleProps>()(
  (theme, { error }) => ({
    fieldSetContainer: {
      borderRadius: '8px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: error
        ? theme.palette.components.input.outlined.errorBorder
        : theme.palette.components.input.outlined.enabledBorder,
      margin: '0',
      padding: '0 8px',
      position: 'absolute',
      top: '-5px',
      left: '0',
      right: '0',
      bottom: '0',
    },
    content: {
      padding: '16.5px 14px',
      zIndex: 1,
    },
    inputContainer: {
      position: 'relative',
      display: 'inline-flex',
      flexDirection: 'column',
      verticalAlign: 'top',
      width: '100%',
    },
    label: {
      fontSize: theme.typography.largeLabel1.fontSize,
      fontWeight: theme.typography.largeLabel1.fontWeight,
      fontFamily: theme.typography.largeLabel1.fontFamily,
      lineHeight: theme.typography.largeLabel1.lineHeight,
      position: 'absolute',
      display: 'block',
      transform: 'translate(14px, -9px) scale(0.75)',
      transformOrigin: 'top left',
      userSelect: 'none',
      color: error
        ? theme.palette.components.input.outlined.errorBorder
        : theme.palette.content.muted,
    },
    legend: {
      height: '11px',
      lineHeight: '0.75rem',
      visibility: 'hidden',
      maxWidth: '100%',
      padding: '0 5px',
    },
    helperText: {
      margin: '3px 14px 0 14px',
      color: error
        ? theme.palette.components.input.outlined.errorBorder
        : theme.palette.components.input.outlined.enabledBorder,
    },
  }),
);

export default useInputFieldWrapperStyles;
