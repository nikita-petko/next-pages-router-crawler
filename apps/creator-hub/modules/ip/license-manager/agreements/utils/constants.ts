const RevShareColorHexes: string[] = [
  '#9E78EC', // Purple
  '#26FF9C', // Light Green
];

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

export default RevShareColorHexes;
