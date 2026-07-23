import { autocompleteClasses, makeStyles } from '@rbx/ui';

const useAutocompleteChoiceControlStyles = makeStyles()((theme) => {
  return {
    root: {
      maxWidth: 400,
    },
    popper: {
      zIndex: theme.zIndex.modal + 1,
    },
    listbox: {
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'flex-start',
      maxHeight: 'none',
      // Keep per-option spacing stable when list is long.
      [`& .${autocompleteClasses.option}`]: {
        flexShrink: 0,
      },
    },
    expandedListbox: {
      flexWrap: 'wrap',
      [`& .${autocompleteClasses.option}`]: {
        width: 300,
      },
    },
  };
});

export default useAutocompleteChoiceControlStyles;
