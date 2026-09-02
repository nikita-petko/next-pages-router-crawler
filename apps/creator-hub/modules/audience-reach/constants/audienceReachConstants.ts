/** Age boundary below which content qualifies as "All Ages" for reach purposes. */
export const AllAgesThreshold = 9;
/** Age boundary at and above which reach is capped at 16+. */
export const Ages16PlusThreshold = 16;

export const AudienceReachRoute = '/audience-reach';
export const PublishingPermissionsRoute = '/settings/eligibility/publishing-permissions';
export const ExperienceQuestionnaireRoute = '/experience-questionnaire';
export const SelectReviewDocsLink =
  '/docs/production/publishing/publish-games-and-places#expedited-review-fee';

/**
 * The app-wide QueryClient disables retries (`retry: false`), which means a single transient
 * blip on any of the three audience-reach content queries replaces the page with FailureView.
 * Opt those queries into a small exponential backoff to absorb such blips.
 */
export const TransientQueryRetry = 2;
export const transientQueryRetryDelay = (attemptIndex: number): number =>
  Math.min(1000 * 2 ** attemptIndex, 30_000);
