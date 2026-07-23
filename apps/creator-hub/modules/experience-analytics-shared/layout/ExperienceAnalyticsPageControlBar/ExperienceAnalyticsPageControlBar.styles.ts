import { makeStyles } from '@rbx/ui';

const useAnalyticsPageControlBarStyles = makeStyles()((theme) => {
  const controlBarSelectorMargin = '0 8px 16px 0';
  const controlBarSelectorWidth = {
    width: '220px',
    [theme.breakpoints.down('XSmall')]: {
      width: '150px',
    },
  };

  return {
    controlBarPadding: {
      paddingTop: '16px',
      paddingBottom: '16px',
      gap: '20px',
      [theme.breakpoints.up('Large')]: {
        paddingBottom: 0,
      },
    },
    controlBarSelector: {
      margin: controlBarSelectorMargin,
      ...controlBarSelectorWidth,
    },
    foundationControlBarSelector: {
      // Match the legacy `controlBarSelector` gutters so Foundation-based
      // controls line up with the rest of the control bar (right + bottom
      // spacing between adjacent controls).
      margin: controlBarSelectorMargin,
      ...controlBarSelectorWidth,
    },
    controlBarFilter: {
      margin: controlBarSelectorMargin,
      '& .MuiFormControl-root': {
        ...controlBarSelectorWidth,
      },
    },
    // Foundation "Filter by" button has no label, so it needs the same
    // gutter margin as the labelled controls without the fixed selector
    // width (the button hugs its own content).
    foundationControlBarFilter: {
      margin: controlBarSelectorMargin,
    },
    controlBarIconButton: {
      margin: controlBarSelectorMargin,
      color: 'inherit',
    },
    showVersionAnnotationsSelection: {
      margin: '8px 0 10px 0',
    },
    versionAnnotationsTooltipSpacing: {
      marginLeft: '4px',
      position: 'relative',
      top: '4px',
    },
    filterBarShowText: {
      fontSize: '16px',
      padding: '10px 0px',
      margin: '0px 10px 0px 0px',
    },
    filterBarFilterControl: {
      marginRight: '10px',
      minWidth: '200px',
      [theme.breakpoints.down('Medium')]: {
        width: '100%',
        minWidth: '130px',
      },
    },
    datePickerStyle: {
      margin: theme.spacing(-0.3, 1, 2, 0),
    },
    relativeDatePickerMenuItemLayout: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '10px',
    },
    relativeDatePickerConfirmButtonFlexLayout: {
      alignSelf: 'flex-end',
    },
    searchTextFieldStyle: {
      minWidth: '15em',
      [theme.breakpoints.down('Medium')]: {
        width: '100%',
        minWidth: '10em',
      },
    },
    numericFieldStyle: {
      minWidth: '15em',
      [theme.breakpoints.down('Medium')]: {
        width: '100%',
        minWidth: '10em',
      },
      // NOTE(shumingxu, 02/16/2024): Needed to remove arrows from MUI component
      // See: https://stackoverflow.com/questions/74194120/remove-arrows-in-mui-number-textfield
      '& input::-webkit-outer-spin-button, input::-webkit-inner-spin-button': {
        WebkitAppearance: 'none',
        margin: 0,
      },
      '& input[type=number]': {
        MozAppearance: 'textfield',
      },
    },
  };
});

export default useAnalyticsPageControlBarStyles;
