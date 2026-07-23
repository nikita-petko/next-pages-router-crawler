import { RAQIV2UIPseudoDimension, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import USER_SEGMENTATION_DIMENSIONS from '@modules/experience-analytics-shared/constants/UserSegmentationDimensions';

const engagementDimensions: ReadonlyArray<TRAQIV2Dimension> = [
  RAQIV2Dimension.AgeGroupV2,
  RAQIV2Dimension.Platform,
  RAQIV2Dimension.OperatingSystem,
  RAQIV2Dimension.Gender,
  RAQIV2Dimension.IsNewUser,
  RAQIV2UIPseudoDimension.TopCountries,
  RAQIV2UIPseudoDimension.TopLocales,
  ...USER_SEGMENTATION_DIMENSIONS,
  RAQIV2Dimension.UserO18Eligibility,
] as const;
export default engagementDimensions;
