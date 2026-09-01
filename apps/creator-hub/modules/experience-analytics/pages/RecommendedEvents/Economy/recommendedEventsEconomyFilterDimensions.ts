import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
const recommendedEventsEconomyFilterDimensions: ReadonlyArray<TRAQIV2Dimension> = [
  RAQIV2Dimension.TransactionType,
  RAQIV2Dimension.FlowType,
  RAQIV2Dimension.CustomField1,
  RAQIV2Dimension.CustomField2,
  RAQIV2Dimension.CustomField3,
  RAQIV2Dimension.AgeGroup,
  RAQIV2Dimension.Gender,
  RAQIV2Dimension.PayerStatus,
  RAQIV2Dimension.IsNewUser,
  RAQIV2Dimension.OperatingSystem,
  RAQIV2Dimension.Platform,
] as const;
export default recommendedEventsEconomyFilterDimensions;
