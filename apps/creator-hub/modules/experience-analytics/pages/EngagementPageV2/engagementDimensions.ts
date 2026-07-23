import { TRAQIV2BreakdownDimension } from '@modules/clients/analytics';
import { RAQIV2UIPseudoDimension, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { USER_SEGMENTATION_DIMENSIONS } from '@modules/experience-analytics-shared';

const engagementDimensions: ReadonlyArray<TRAQIV2BreakdownDimension> = [
  RAQIV2Dimension.AgeGroup,
  RAQIV2Dimension.Platform,
  RAQIV2Dimension.OperatingSystem,
  RAQIV2Dimension.Gender,
  RAQIV2Dimension.IsNewUser,
  RAQIV2UIPseudoDimension.TopCountries,
  RAQIV2UIPseudoDimension.TopLocales,
  ...USER_SEGMENTATION_DIMENSIONS,
] as const;
export default engagementDimensions;
