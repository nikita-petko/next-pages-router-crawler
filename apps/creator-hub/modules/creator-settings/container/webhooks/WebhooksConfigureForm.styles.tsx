import { makeStyles } from '@rbx/ui';

const useWebhooksConfigureFormStyles = makeStyles()((theme) => ({
  grid: {
    maxWidth: 1200,
    rowGap: 48,
    width: 'fit-content',
    [theme.breakpoints.down('XLarge')]: {
      maxWidth: 900,
    },
  },

  textFieldGrid: {
    maxWidth: 600,
    rowGap: 24,
  },

  buttonFormat: {
    whiteSpace: 'nowrap',
  },

  tooltip: {
    maxWidth: 750,
  },

  titleGap: {
    rowGap: 16,
  },

  fieldGap: {
    rowGap: 24,
  },

  itemGap: {
    rowGap: 8,
  },

  buttonGap: {
    gap: 12,
  },

  toggledSecretContainer: {
    alignItems: 'center',
    width: 'fit-content',
  },

  secretIconHint: {
    marginTop: 4,
  },

  saveChangesButton: {
    marginRight: 8,
  },

  testResponse: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },

  leftButtons: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    width: 'fit-content',
    height: 'fit-content',
  },

  rightButtons: {
    flexGrow: 2,
    flexShrink: 1,
    flexBasis: 'auto',
    width: 'fit-content',
    height: 'fit-content',
  },
}));

export default useWebhooksConfigureFormStyles;
