import type {
  CreatorTierEnum,
  ReasonEnum,
  SelectStatusEnum,
} from '@rbx/client-core-content-api/v1';

export enum ReachLevel {
  AllAges = 'AllAges',
  Ages9Plus = 'Ages9Plus',
  Ages16Plus = 'Ages16Plus',
  /**
   * Public experience that is rated under 16 but currently not select-eligible.
   * The audience is restricted to 16+ players plus the creator's trusted friends.
   */
  Ages16PlusAndTrustedFriends = 'Ages16PlusAndTrustedFriends',
  /**
   * Creator tier is Private OR the experience itself is private/restricted.
   * Only the creator (and possibly editors) can play.
   */
  PersonalUse = 'PersonalUse',
}

export enum ThresholdBarColor {
  /** Threshold doesn't apply (unrated, private, or rated 16+). */
  Muted = 'Muted',
  /** Experience is not currently select-eligible. */
  Blue = 'Blue',
  /** Eligible but at risk of losing eligibility due to the Threshold reason. */
  Yellow = 'Yellow',
  /** Eligible with no threshold concern. */
  Green = 'Green',
}

export interface ContentRatingDetails {
  ratingLabel: string | null;
  minimumAge: number;
  descriptors: string[];
  isUnrated: boolean;
}

export interface AudienceReachState {
  reachLevel: ReachLevel;
  creatorTier: CreatorTierEnum;
  creatorEveryoneWithoutSubscription: boolean;
  contentRating: ContentRatingDetails;
  isPrivate: boolean;
  selectIndicator: number;
  indicatorLastUpdated: Date | null;
  selectReasons: ReasonEnum[];
  selectStatus: SelectStatusEnum;
  thresholdBarColor: ThresholdBarColor;
  thresholdDaysRemaining: number;
  underReview: boolean | null;
  isPublishedToGatedAudience: boolean;
}
