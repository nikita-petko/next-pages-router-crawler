import { ServerCampaignObjectiveType, ServerDetailedTargetingMatchType } from '@constants/campaign';
import { GetAudienceEstimateResponseType } from '@type/advancedTargeting';
import {
  ObjectiveRequiresMinimumAudienceSize,
  RequiresMinimumAudienceSize,
} from '@utils/campaignBuilder';
import { EmptyRequestStateType } from '@utils/zustandUtils';

export const EstimateString = ({
  est,
  lessThan1KLabel = '< 1K',
  lowerBound,
  upperBound,
}: {
  est: number;
  lessThan1KLabel?: string;
  lowerBound: number;
  upperBound: number;
}) => {
  const formatter = Intl.NumberFormat('en', {
    maximumSignificantDigits: 2,
    notation: 'compact',
  }); // this would need to change based on language
  if (lowerBound > 0 && upperBound > 0 && (est === undefined || est <= 0)) {
    if (lowerBound < 1000) {
      return lessThan1KLabel;
    }
    return `${formatter.format(lowerBound)} - ${formatter.format(upperBound)}`;
  }
  if (est < 1000) {
    return lessThan1KLabel;
  }
  return `${formatter.format(est)}`;
};

export const IsObjectiveAudienceSizeBelowThreshold = ({
  estimate,
  lowerBound,
  objective,
}: {
  estimate?: EmptyRequestStateType<GetAudienceEstimateResponseType>;
  lowerBound: number;
  objective: ServerCampaignObjectiveType;
}) =>
  !!(
    ObjectiveRequiresMinimumAudienceSize(objective) &&
    estimate &&
    !estimate.isLoading &&
    !estimate.isError &&
    (estimate.data?.estimate_audience_lower_bound ?? lowerBound) < lowerBound
  );

export const IsAudienceSizeBelowThreshold = ({
  detailedTargetingMatchType,
  estimate,
  lowerBound,
}: {
  detailedTargetingMatchType: ServerDetailedTargetingMatchType;
  estimate?: EmptyRequestStateType<GetAudienceEstimateResponseType>;
  lowerBound: number;
}) =>
  !!(
    RequiresMinimumAudienceSize(detailedTargetingMatchType) &&
    estimate &&
    !estimate.isLoading &&
    !estimate.isError &&
    (estimate.data?.estimate_audience_lower_bound ?? lowerBound) < lowerBound
  );

export const GetMinimumAudienceSize = (
  audience: ServerDetailedTargetingMatchType,
  {
    reactivationObjectiveMinimumAudienceSize,
    retargetingObjectiveMinimumAudienceSize,
    retentionObjectiveMinimumAudienceSize,
  }: {
    reactivationObjectiveMinimumAudienceSize: number;
    retargetingObjectiveMinimumAudienceSize: number;
    retentionObjectiveMinimumAudienceSize: number;
  },
): number => {
  let minimumAudienceSize = 0;
  switch (audience) {
    case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_RETENTION:
      if (retentionObjectiveMinimumAudienceSize > 0) {
        minimumAudienceSize = retentionObjectiveMinimumAudienceSize;
      } else {
        minimumAudienceSize = retargetingObjectiveMinimumAudienceSize;
      }
      break;
    case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_REACTIVATION:
      if (reactivationObjectiveMinimumAudienceSize > 0) {
        minimumAudienceSize = reactivationObjectiveMinimumAudienceSize;
      } else {
        minimumAudienceSize = retargetingObjectiveMinimumAudienceSize;
      }
      break;
    default:
  }
  return minimumAudienceSize;
};

export const GetWarningAudienceSize = (
  goal: ServerDetailedTargetingMatchType,
  {
    reactivationObjectiveWarningAudienceSize,
    retargetingObjectiveWarningAudienceSize,
    retentionObjectiveWarningAudienceSize,
  }: {
    reactivationObjectiveWarningAudienceSize: number;
    retargetingObjectiveWarningAudienceSize: number;
    retentionObjectiveWarningAudienceSize?: number;
  },
): number => {
  let warningAudienceSize = 0;
  switch (goal) {
    case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_RETENTION:
      if (retentionObjectiveWarningAudienceSize && retentionObjectiveWarningAudienceSize > 0) {
        warningAudienceSize = retentionObjectiveWarningAudienceSize;
      } else {
        warningAudienceSize = retargetingObjectiveWarningAudienceSize;
      }
      break;
    case ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_REACTIVATION:
      if (reactivationObjectiveWarningAudienceSize > 0) {
        warningAudienceSize = reactivationObjectiveWarningAudienceSize;
      } else {
        warningAudienceSize = retargetingObjectiveWarningAudienceSize;
      }
      break;
    default:
  }
  return warningAudienceSize;
};
