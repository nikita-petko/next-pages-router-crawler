import { makeStyles } from '@rbx/ui';

const useTryAssetFormStyles = makeStyles()((theme) => ({
  deepLinkCode: {
    display: 'inline-block',
    border: `1px solid ${theme.palette.surface.outline}`,
    borderRadius: 4,
    paddingInline: 4,
    marginTop: 8,
  },

  customModeContent: {
    // Align with radio label text: radio button width + gap
    marginLeft: 'calc(var(--size-500) + var(--gap-medium))',
    marginTop: 16,
  },

  deepLinkInfo: {
    marginTop: 16,
  },

  divider: {
    marginBottom: 48,
  },

  existingPlaceNotValidAlert: {
    marginTop: 16,
  },

  existingPlaceNotValidAlertTitle: {
    marginBottom: 8,
  },

  editDefaultLink: {
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: theme.palette.actionV2.primary.fill,
    cursor: 'pointer',
    display: 'flex',
    fontSize: 14,
    gap: 4,
    marginTop: 8,
    padding: 0,
    textDecoration: 'underline',
    '&:hover': {
      textDecoration: 'none',
    },
  },

  formContainer: {
    marginTop: 48,
    marginBottom: 8,
  },

  header: {
    marginBottom: 8,
  },

  radioGroup: {
    marginTop: 16,
    // RadioGroup uses size='Small' for smaller radio circles;
    // override the label and hint text back to Medium typography
    '& .text-body-small': {
      font: 'var(--typography-body-medium-font)',
      letterSpacing: 'var(--typography-body-medium-letter-spacing)',
    },
    '& .text-title-small': {
      font: 'var(--typography-title-medium-font)',
      letterSpacing: 'var(--typography-title-medium-letter-spacing)',
    },
  },

  previewButton: {
    // Align with radio label text and custom mode content: radio button width + gap
    marginLeft: 'calc(var(--size-500) + var(--gap-medium))',
    marginTop: 16,
  },

  placeIdField: {
    marginTop: 24,
    // These overrides are needed to prevent the default browser number input styling
    // The placeId field is a number input, but we want to use a text input
    // Users will not need to manually increment/decrement these values
    '& input[type=number]': {
      MozAppearance: 'textfield',
      WebkitAppearance: 'textfield',
    },
    '& input[type=number]::-webkit-outer-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
    '& input[type=number]::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
  },
}));

export default useTryAssetFormStyles;
