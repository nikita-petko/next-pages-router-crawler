import { makeStyles } from '@rbx/ui';

const useAdvancedTargetingGenreAutocompleteStyles = makeStyles()((theme) => ({
  autocompleteListboxOption: {
    '& .MuiAutocomplete-option': {
      alignItems: 'flex-start',
      display: 'flex',
      flexDirection: 'column',
    },
  },
  expandedGenresRow: {
    padding: '8px 16px 8px 16px',
  },
  sectionDescription: {
    color: theme.palette.states.active,
    fontSize: '14px',
  },
  sectionExpansionContainer: {
    minWidth: '100%',
    width: '100%',
  },
  sectionTitleContainer: {
    display: 'flex',
    minWidth: '100%',
    width: '100%',
  },
}));

export default useAdvancedTargetingGenreAutocompleteStyles;
