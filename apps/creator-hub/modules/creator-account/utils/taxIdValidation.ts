import { TaxIdType } from '@modules/clients/brandPlatform';

/**
 * Regular expression patterns for validating tax ID formats by type.
 * Each pattern corresponds to the official format requirements for that tax ID type.
 */
export const TAX_ID_VALIDATION_PATTERNS: Record<string, string> = {
  invalid: '',

  // United States EIN: Format XX-XXXXXXX (2 digits, dash, 7 digits)
  // Source: https://www.irs.gov/pub/irs-pdf/p1635.pdf, page 4
  united_states_ein: '^\\d{2}-\\d{7}$',

  // European VAT Number
  // Source: https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s21.html
  european_vat_number:
    '^((AT)?U[0-9]{8}|(BE)?0[0-9]{9}|(BG)?[0-9]{9,10}|(CY)?[0-9]{8}L|(CZ)?[0-9]{8,10}|(DE)?[0-9]{9}|(DK)?[0-9]{8}|(EE)?[0-9]{9}|(EL|GR)?[0-9]{9}|(ES)?[0-9A-Z][0-9]{7}[0-9A-Z]|(FI)?[0-9]{8}|(FR)?[0-9A-Z]{2}[0-9]{9}|(GB)?([0-9]{9}([0-9]{3})?|[A-Z]{2}[0-9]{3})|(HU)?[0-9]{8}|(IE)?[0-9]S[0-9]{5}L|(IT)?[0-9]{11}|(LT)?([0-9]{9}|[0-9]{12})|(LU)?[0-9]{8}|(LV)?[0-9]{11}|(MT)?[0-9]{8}|(NL)?[0-9]{9}B[0-9]{2}|(PL)?[0-9]{10}|(PT)?[0-9]{9}|(RO)?[0-9]{2,10}|(SE)?[0-9]{12}|(SI)?[0-9]{8}|(SK)?[0-9]{10})$',

  // United Kingdom VAT Number: Format GBNNNNNNNNN (GB prefix, 9 digits)
  // Source: https://design.tax.service.gov.uk/examples/vat-registration-number/heading/
  united_kingdom_vat_number: '^GB\\d{9}$',

  // Canadian Business Number: Format NNNNNNNNNRTNNNN (9 digits, RT, 4 digits)
  // Source: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/registering-your-business/you-need-a-business-number-a-program-account.html
  canadian_business_number: '^\\d{9}(RT|RC|RM|RP)\\d{4}$',

  // Canadian GST/HST Number: Format NNNNNNNNNRTNNNN (9 digits, RT, 4 digits)
  // Source: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/registering-your-business/you-need-a-business-number-a-program-account.html
  canadian_gst_hst_number: '^\\d{9}RT\\d{4}$',

  // Mexican RFC Number: Format AAANNNNNNXXX (3-4 letters, 6 digits, 3 alphanumeric)
  // Source: https://taxid.pro/docs/countries/mexico
  mexican_rfc_number: '^[A-Z&Ñ]{3,4}\\d{6}[A-Z0-9]{3}$',
};

/**
 * Sample tax ID formats to show as placeholders for each tax ID type.
 * These examples help users understand the expected format.
 */
export const TAX_ID_PLACEHOLDER_EXAMPLES: Record<string, string> = {
  united_states_ein: '12-3456789',
  european_vat_number: 'DE123456789',
  united_kingdom_vat_number: 'GB123456789',
  canadian_business_number: '123456789RP0001',
  canadian_gst_hst_number: '123456789RT0001',
  mexican_rfc_number: 'ABC123456D12',
};

/**
 * Validates a tax ID against its corresponding format pattern.
 *
 * @param taxId - The tax ID to validate
 * @param taxIdType - The type of tax ID to validate against
 * @returns true if the tax ID is valid for the given type, false otherwise
 */
export const validateTaxIdFormat = (taxId: string, taxIdType?: string | TaxIdType): boolean => {
  if (!taxId || !taxIdType || taxIdType === 'invalid' || taxIdType === TaxIdType.Invalid) {
    return true; // No validation needed if no tax ID or invalid type
  }

  const pattern = TAX_ID_VALIDATION_PATTERNS[taxIdType];
  if (!pattern) {
    // No pattern available for this tax ID type - this is expected for Invalid types
    return true;
  }

  try {
    const regex = new RegExp(pattern);
    return regex.test(taxId);
  } catch {
    // Invalid regex pattern indicates a programming bug in our constants
    // In development, throw the error to catch bugs early
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Invalid regex pattern for tax ID type ${taxIdType}: ${pattern}`);
    }

    // In production, fail safely by returning false (reject the tax ID)
    return false;
  }
};

/**
 * Gets the placeholder example for a specific tax ID type.
 *
 * @param taxIdType - The tax ID type
 * @returns The placeholder example string, or empty string if not found
 */
export const getTaxIdPlaceholderExample = (taxIdType?: string | TaxIdType): string => {
  if (!taxIdType || taxIdType === 'invalid' || taxIdType === TaxIdType.Invalid) {
    return '';
  }
  return TAX_ID_PLACEHOLDER_EXAMPLES[taxIdType] || '';
};
