/**
 * Inline styles to override TextInput focus states for better visibility in Studio widget.
 * This replicates the focus behavior from foundation-web without requiring a package update.
 *
 * These styles:
 * 1. Remove the default outline-focus behavior from foundation-web's TextInput
 * 2. Add colored borders on focus for better visibility in the compact Studio environment
 *
 * TODO(gperkins@20251104): Remove this if we can get our foundation-web PR approved
 */
export const studioInputFocusStyles = `
  /* Remove default outline-focus from TextInput containers */
  .stroke-contrast-alpha.focus-within\\:outline-focus:focus-within {
    outline: none;
  }

  /* Add visible colored borders on focus instead */
  @media (prefers-color-scheme: dark) {
    :root .stroke-contrast-alpha:focus-within,
    :root .stroke-contrast-alpha:focus {
      border-color: var(--color-content-static-light);
    }
  }
  
  :is(:root, .light-theme) .stroke-contrast-alpha:focus-within,
  :is(:root, .light-theme) .stroke-contrast-alpha:focus {
    border-color: var(--color-content-link);
  }
  
  .dark-theme .stroke-contrast-alpha:focus-within,
  .dark-theme .stroke-contrast-alpha:focus {
    border-color: var(--color-content-static-light);
  }
  
  .system-theme .stroke-contrast-alpha:focus-within,
  .system-theme .stroke-contrast-alpha:focus {
    border-color: var(--color-content-link);
  }
  
  @media (prefers-color-scheme: dark) {
    .system-theme .stroke-contrast-alpha:focus-within,
    .system-theme .stroke-contrast-alpha:focus {
      border-color: var(--color-content-static-light);
    }
  }
`;

export default studioInputFocusStyles;
