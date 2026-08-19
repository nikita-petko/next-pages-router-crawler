import { makeStyles } from '@rbx/ui';

import { marginUnit, paddingUnit } from '@constants/styleConstants';

const useStripeFormStyles = makeStyles()((theme) => ({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'var(--color-common-backdrop)',
    display: 'flex',
    inset: 0,
    justifyContent: 'center',
    // Block background scroll / scroll-chaining behind the overlay on touch
    // devices (e.g. iOS Safari) while the card is authenticating, matching the
    // scroll-blocking the previous @rbx/ui <Backdrop> provided.
    overscrollBehavior: 'contain',
    position: 'fixed',
    touchAction: 'none',
    zIndex: 2,
  },

  billingAddressFormHeader: {
    display: 'block',
    marginBottom: marginUnit * 1.5,
    marginTop: marginUnit * 3,
  },

  bottomDivider: {
    display: 'block',
    marginBottom: marginUnit * 4,
    marginTop: marginUnit * 4,
  },

  buttonContainer: {
    marginTop: marginUnit * 3,
    textAlign: 'center',
  },

  buttonRow: {
    '& > button': {
      width: 'auto',
    },
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: marginUnit * 1.5,
  },

  cancelButton: {
    '@media (max-width: 475px)': {
      display: 'block',
      marginBottom: marginUnit * 2,
    },
    borderColor: theme.palette.surface.outline,
    color: theme.palette.content.muted,
    marginRight: marginUnit,
  },

  cardHoldReminder: {
    display: 'block',
    marginBottom: marginUnit * 3,
  },

  circularProgress: {
    color: theme.palette.content.action,
    marginBottom: marginUnit * 2,
  },

  inProgressText: {
    display: 'block',
  },

  loadingStateContainer: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    margin: marginUnit * 2,
    padding: paddingUnit * 2,
    width: '100%',
  },

  stripeFormHeader: {
    display: 'block',
    marginBottom: marginUnit * 3,
    marginTop: marginUnit * 4,
  },

  submitLoadingStateContainer: {
    textAlign: 'center',
  },
}));
export default useStripeFormStyles;
