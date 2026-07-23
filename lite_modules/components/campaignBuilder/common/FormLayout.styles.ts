import { makeStyles } from '@rbx/ui';

// Form layout utility styles
const useFormLayoutStyles = makeStyles()((theme) => ({
  formColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
  },
  formLabel: {
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
  },
  formRow: {
    '& > *': {
      flex: '1 1 auto',
    },
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
  },
  fullWidth: {
    width: '100%',
  },
  halfWidth: {
    minWidth: '276px',
    width: 'calc(50% - 8px)',
  },
  halfWidthSkeleton: {
    height: '56px',
    minWidth: '276px',
    width: 'calc(50% - 8px)',
  },
  inlineAction: {
    alignSelf: 'center',
    flexShrink: 0,
  },
  inlineRow: {
    marginTop: '24px',
  },
  inlineSelector: {
    flexGrow: '1',
    minWidth: '276px',
  },
  inlineSelectorContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
  },
  noMargin: {
    margin: 0,
  },
  paymentSectionHeader: {
    // ListSubheader defaults to overline typography (uppercase); names should stay as-is.
    textTransform: 'none',
  },
  quarterWidth: {
    minWidth: '130px',
    width: 'calc(50% - 8px)',
  },
}));

export default useFormLayoutStyles;
