import { CreatorTierEnum, ReasonEnum, SelectStatusEnum } from '@rbx/client-core-content-api/v1';
import { Ages16PlusThreshold } from '@modules/audience-reach/constants/audienceReachConstants';
import { Audience } from '../ConfigureExperienceTypes';

export type AudienceValidationInput = {
  audiences: Audience[] | undefined;
  userCreatorTier: CreatorTierEnum;
  universeCreatorTier: CreatorTierEnum;
  selectStatus: SelectStatusEnum;
  reasons: ReasonEnum[];
  contentMinimumAge: number;
  isUnrated: boolean;
  enableAtRiskAnnotation: boolean;
  // True when paid access (Robux/Fiat) is enabled on the experience.
  // When true, the audience must be Public.
  isPublicConnectionsDisabled: boolean;
};

export type AudienceValidationState =
  | { type: 'none' }
  | {
      type: 'error';
      kind:
        | 'user-tier-private'
        | 'creator-tier-private'
        | 'questionnaire-incomplete'
        | 'public-required';
    }
  | { type: 'warning'; kind: 'select-loss' }
  | { type: 'info'; kind: 'limited-reach' };

export const getAudienceValidationState = (
  input: AudienceValidationInput,
): AudienceValidationState => {
  const {
    audiences,
    userCreatorTier,
    universeCreatorTier,
    selectStatus,
    reasons,
    contentMinimumAge,
    isUnrated,
    enableAtRiskAnnotation,
    isPublicConnectionsDisabled,
  } = input;

  const isAudiencePrivateOnly = audiences?.length === 1 && audiences[0] === Audience.Editors;
  const isAudienceLimitedOrPublic = !!audiences && audiences.length > 0 && !isAudiencePrivateOnly;
  const isAudiencePublic = audiences?.includes(Audience.Public) ?? false;

  // Paid access (Robux/Fiat) requires the audience to be Public. This error
  // takes precedence over all other audience validation states because the
  // user cannot publish until they either change the audience to Public or
  // disable the conflicting access settings.
  if (isPublicConnectionsDisabled && !isAudiencePublic) {
    return { type: 'error', kind: 'public-required' };
  }

  const isSelectEligible = selectStatus === SelectStatusEnum.Eligible;
  const isSelectAtRisk = isSelectEligible && reasons.includes(ReasonEnum.CreatorEligibility);
  const isContentRatedUnder16 = !isUnrated && contentMinimumAge < Ages16PlusThreshold;
  const isReachLimited = !isSelectEligible;

  if (isAudienceLimitedOrPublic && userCreatorTier === CreatorTierEnum.Private) {
    return { type: 'error', kind: 'user-tier-private' };
  }
  if (isAudienceLimitedOrPublic && universeCreatorTier === CreatorTierEnum.Private) {
    return { type: 'error', kind: 'creator-tier-private' };
  }
  if (isAudienceLimitedOrPublic && isUnrated) {
    return { type: 'error', kind: 'questionnaire-incomplete' };
  }
  if (isSelectAtRisk && enableAtRiskAnnotation) {
    return { type: 'warning', kind: 'select-loss' };
  }
  if (isAudienceLimitedOrPublic && isContentRatedUnder16 && isReachLimited) {
    return { type: 'info', kind: 'limited-reach' };
  }
  return { type: 'none' };
};

// Editors and PlayTesters both keep an experience deactivated server-side; an
// audience selection containing only these values means the experience is
// effectively private. Any other (or additional) audience makes it playable.
export const isPrivateAudienceSelection = (audiences: Audience[] | undefined): boolean =>
  !!audiences &&
  audiences.length > 0 &&
  audiences.every((a) => a === Audience.Editors || a === Audience.PlayTesters);

// Select eligibility is forfeited only when the creator gives up all of their
// reach. The lose-select dialog should fire when the previously-saved audience
// included Public or Friends but the new selection has neither. Any change
// that keeps at least one reach-bearing audience (or never had one to begin
// with) is a no-op for select.
const audienceLosesAllReach = (
  current: Audience[] | undefined,
  previous: Audience[] | undefined,
): boolean => {
  const cur = new Set(current ?? []);
  const prev = new Set(previous ?? []);
  const prevHadReach = prev.has(Audience.Public) || prev.has(Audience.Friends);
  const curHasReach = cur.has(Audience.Public) || cur.has(Audience.Friends);
  return prevHadReach && !curHasReach;
};

export const shouldShowLoseSelectDialog = (
  state: AudienceValidationState,
  audiences: Audience[] | undefined,
  previousAudiences: Audience[] | undefined,
  isAudiencesDirty: boolean,
): boolean =>
  state.type === 'warning' &&
  state.kind === 'select-loss' &&
  isAudiencesDirty &&
  audienceLosesAllReach(audiences, previousAudiences);
