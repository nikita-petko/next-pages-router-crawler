import { makeStyles } from '@rbx/ui';

const useAccessPermissionFormStyles = makeStyles()({
  subLabel: {
    marginTop: 8,
    display: 'block',
  },

  accessPermissionSubLabel: {
    marginTop: 24,
  },

  searchApiContainer: {
    '&.MuiGrid-item': {
      maxWidth: 300,
    },
  },

  searchApiList: {
    minWidth: 'fit-content',

    // allows disabled entries to be hoverable, enabling tooltip
    '.MuiAutocomplete-option[aria-disabled="true"]': {
      pointerEvents: 'auto',
    },
  },

  warningContainer: {
    marginBottom: 16,
  },

  warningItem: {
    display: 'flex',
    alignItems: 'center',
  },
});

export default useAccessPermissionFormStyles;
