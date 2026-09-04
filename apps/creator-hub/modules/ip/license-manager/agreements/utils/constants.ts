/** Diameter (px) of the loading spinner shown inside large CTA buttons on the match panels. */
export const BUTTON_SPINNER_SIZE = 22;

export enum AgreementFilterKeys {
  Offers = 'offers',
  Requests = 'requests',
  Active = 'active',
  Inactive = 'inactive',
}

const AGREEMENT_FILTER_KEY_VALUES = new Set<string>(Object.values(AgreementFilterKeys));

export const isAgreementFilterKey = (value: string | undefined): value is AgreementFilterKeys => {
  return value !== undefined && AGREEMENT_FILTER_KEY_VALUES.has(value);
};
