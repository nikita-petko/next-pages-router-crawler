import { makeStyles } from '@rbx/ui';

const useAdvancedTargetingLocationAutocompleteStyles = makeStyles()(() => ({
  autocompleteBox: {
    paddingBottom: 5,
    paddingTop: '30px !important',
  },
  countryRow: {
    paddingLeft: 25,
    width: '100%',
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
  regularRow: {
    width: '99%',
  },
  sectionExpandToggleIconContainer: {
    marginLeft: 'auto',
    position: 'absolute',
    right: 18,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 99999,
  },
  sectionExpansionContainer: {
    '&:hover': {
      backgroundColor: 'rgb(57, 58, 64)', // standard for mui v5 autocomplete
    },
    minWidth: '99%',
    paddingLeft: '12px',
    position: 'relative',
    width: '99%',
  },
}));

export default useAdvancedTargetingLocationAutocompleteStyles;
