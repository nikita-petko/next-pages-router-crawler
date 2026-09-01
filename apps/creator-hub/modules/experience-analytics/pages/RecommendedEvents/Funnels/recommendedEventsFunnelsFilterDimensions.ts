import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
const recommendedEventsFunnelsFilterDimensions: ReadonlyArray<TRAQIV2Dimension> = [
  RAQIV2Dimension.CustomField1,
  RAQIV2Dimension.CustomField2,
  RAQIV2Dimension.CustomField3,
  RAQIV2Dimension.AgeGroup,
  RAQIV2Dimension.Gender,
  RAQIV2Dimension.PayerStatus,
  RAQIV2Dimension.OperatingSystem,
  RAQIV2Dimension.Platform,
  RAQIV2Dimension.IsNewUser,
];
export default recommendedEventsFunnelsFilterDimensions;
