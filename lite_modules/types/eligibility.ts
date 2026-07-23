export enum EligibilityStatus {
  ELIGIBILITY_STATUS_UNSPECIFIED = 0,
  ELIGIBLE = 1,
  NOT_ELIGIBLE = 2,
}

interface CampaignEligibility {
  objectiveEligibility: Record<number, EligibilityStatus>;
}

export interface GetEligibilityResponse {
  campaignEligibility: CampaignEligibility;
  universeId: number;
}
