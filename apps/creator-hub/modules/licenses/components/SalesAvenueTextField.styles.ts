import { makeStyles } from '@rbx/ui';

/** Fixed input height across empty, error, and resolved states to prevent layout shift. */
export const SALES_AVENUE_FIELD_HEIGHT_PX = 58;

/** Thumbnail size in the resolved sales-avenue field (matches 50x50 asset thumbnail). */
export const THUMBNAIL_SIZE_PX = 40;

export const foundationInputRootClass = (hasError: boolean) =>
  [
    'foundation-web-input',
    'stroke-standard',
    hasError ? 'stroke-system-alert' : 'stroke-contrast-alpha',
  ].join(' ');

const useSalesAvenueTextFieldStyles = makeStyles()((theme) => {
  /** Clear affordance inset + slot width; keep in sync across input and resolved layouts. */
  const clearButtonInset = theme.spacing(1);
  const clearButtonSlotWidth = theme.spacing(3);
  const fieldEndPadding = `calc(${clearButtonInset} + ${clearButtonSlotWidth})`;

  return {
    fieldShell: {
      position: 'relative',
      width: '100%',
    },
    clearIcon: {
      cursor: 'pointer',
      color: theme.palette.content.muted,
    },
    clearButtonAbsolute: {
      position: 'absolute',
      top: SALES_AVENUE_FIELD_HEIGHT_PX / 2,
      right: clearButtonInset,
      transform: 'translateY(-50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: clearButtonSlotWidth,
      height: clearButtonSlotWidth,
      zIndex: 1,
    },
    textFieldInput: {
      '& .MuiInputBase-input': {
        fontSize: theme.typography.body2.fontSize,
        padding: 0,
      },
      '& .MuiOutlinedInput-root fieldset': {
        border: 'none',
      },
      '& .MuiOutlinedInput-root': {
        height: SALES_AVENUE_FIELD_HEIGHT_PX,
        minHeight: SALES_AVENUE_FIELD_HEIGHT_PX,
        maxHeight: SALES_AVENUE_FIELD_HEIGHT_PX,
        boxSizing: 'border-box',
        alignItems: 'center',
        paddingLeft: theme.spacing(1),
        paddingRight: fieldEndPadding,
      },
      '& .MuiOutlinedInput-root:hover:not(.Mui-disabled):not(.Mui-error):not(.Mui-focused)': {
        backgroundColor: 'var(--color-state-hover)',
      },
      '& .MuiOutlinedInput-root.Mui-focused:not(.Mui-error)': {
        borderColor: `${theme.palette.actionV2.primaryBrand.fill} !important`,
        boxShadow: `inset 0 0 0 1px ${theme.palette.actionV2.primaryBrand.fill} !important`,
      },
      '& .MuiOutlinedInput-root.Mui-error:not(.Mui-focused)': {
        borderColor: `${theme.palette.actionV2.important.fill} !important`,
        boxShadow: 'none !important',
      },
      '& .MuiOutlinedInput-root.Mui-error.Mui-focused': {
        borderColor: `${theme.palette.actionV2.important.fill} !important`,
        boxShadow: `inset 0 0 0 1px ${theme.palette.actionV2.important.fill} !important`,
      },
    },
    textFieldRoot: {
      '& .MuiInputBase-root': {
        height: SALES_AVENUE_FIELD_HEIGHT_PX,
        minHeight: SALES_AVENUE_FIELD_HEIGHT_PX,
        maxHeight: SALES_AVENUE_FIELD_HEIGHT_PX,
        boxSizing: 'border-box',
        alignItems: 'center',
      },
    },
    resolvedRoot: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.5),
      height: SALES_AVENUE_FIELD_HEIGHT_PX,
      minHeight: SALES_AVENUE_FIELD_HEIGHT_PX,
      maxHeight: SALES_AVENUE_FIELD_HEIGHT_PX,
      width: '100%',
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: theme.spacing(1),
      paddingRight: fieldEndPadding,
      borderRadius: theme.border.radius.medium.borderRadius,
      boxSizing: 'border-box',
      border: `1px solid ${theme.palette.surface.outline}`,
      overflow: 'hidden',
    },
    resolvedRootError: {
      borderColor: `${theme.palette.actionV2.important.fill} !important`,
    },
    thumbnailContainer: {
      width: THUMBNAIL_SIZE_PX,
      height: THUMBNAIL_SIZE_PX,
      flexShrink: 0,
      display: 'block',
      padding: 0,
      borderRadius: '50%',
      overflow: 'hidden',
    },
  };
});

export default useSalesAvenueTextFieldStyles;
