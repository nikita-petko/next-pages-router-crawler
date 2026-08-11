export enum EligibilityStatus {
  ELIGIBILITY_STATUS_UNSPECIFIED = 0,
  ELIGIBLE = 1,
  NOT_ELIGIBLE = 2,
}

interface CampaignEligibility {
  objectiveEligibility: Record<number, EligibilityStatus>;
}

interface UniverseEligibility {
  eligible: boolean;
}

export interface GetEligibilityResponse {
  campaignEligibility: CampaignEligibility;
  universeEligibility?: UniverseEligibility;
  universeId: number;
}
