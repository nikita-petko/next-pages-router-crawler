import { makeStyles } from '@rbx/ui';

const useAdvancedTargetingDrawerStyles = makeStyles()((theme) => ({
  audienceEstimateInfoIcon: {
    color: theme.palette.content.muted,
    marginLeft: '6px',
    position: 'relative',
    top: '3px',
  },
  audienceEstimateOrLoadingContainer: {
    height: '36px',
    marginTop: '8px',
  },
  audienceEstimateText: {
    display: 'block',
    marginTop: '8px',
  },
  audienceEstimateWarningContainer: {
    display: 'flex',
  },
  audienceEstimateWarningIcon: {
    marginRight: '6px',
    position: 'relative',
    top: '9px',
  },
  autocompleteBox: {
    paddingBottom: 5,
    paddingTop: '30px !important',
  },
  autoCompleteRoot: {
    '& > * + *': {
      marginTop: 24,
    },
    width: '100%',
  },

  genericAutocompleteSelectedListItem: {
    backgroundColor: '#393a40',
  },

  inputBaseRootOverride: {
    '& .MuiInputBase-root': {
      margin: '0 !important',
      minHeight: '0 !important',
      padding: '10px !important',
    },
    '& .MuiOutlinedInput-root': {
      margin: '0 !important',
      minHeight: '0 !important',
      padding: '10px !important',
    },
  },
}));

export default useAdvancedTargetingDrawerStyles;
