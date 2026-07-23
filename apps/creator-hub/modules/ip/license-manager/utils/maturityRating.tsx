import { UniverseContentMaturity } from '@rbx/client-content-licensing-api/v1';

/**
 * Get a maturity rating label.
 */
export const getMaturityRatingLabel = (rating: UniverseContentMaturity | undefined) => {
  switch (rating) {
    case UniverseContentMaturity.Minimal:
      return 'Label.Minimal';
    case UniverseContentMaturity.Mild:
      return 'Label.Mild';
    case UniverseContentMaturity.Moderate:
      return 'Label.Moderate';
    case UniverseContentMaturity.Restricted:
      return 'Label.Restricted';
    case UniverseContentMaturity.None: // None is functionally equivalent to Restricted
      return 'Label.Restricted';
    default:
      return 'Label.Unknown';
  }
};

export const maturityRatingsList: UniverseContentMaturity[] = [
  UniverseContentMaturity.Minimal,
  UniverseContentMaturity.Mild,
  UniverseContentMaturity.Moderate,
  UniverseContentMaturity.Restricted,
];

export const maturityRatingOptions = maturityRatingsList.map((rating) => ({
  value: rating,
  label: getMaturityRatingLabel(rating),
}));

/**
 * Get a content maturity label for a UniverseContentMaturity value.
 */
export const getContentMaturityLabelFromEnum = (
  contentMaturity: UniverseContentMaturity | undefined,
): string => {
  switch (contentMaturity) {
    case UniverseContentMaturity.Minimal:
      return 'Label.Minimal';
    case UniverseContentMaturity.Mild:
      return 'Label.Mild';
    case UniverseContentMaturity.Moderate:
      return 'Label.Moderate';
    case UniverseContentMaturity.Restricted:
      return 'Label.Restricted';
    case UniverseContentMaturity.None: // None is functionally equivalent to Restricted
      return 'Label.Restricted';
    default:
      return 'Label.MaturityRatingNoneAvailable';
  }
};
