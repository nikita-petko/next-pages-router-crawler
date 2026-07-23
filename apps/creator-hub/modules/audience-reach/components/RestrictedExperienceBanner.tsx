import type { FC } from 'react';
import { Button, FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { developerForum } from '@modules/miscellaneous/urls/creatorHub';

const SAFETY_POLICY_FORUM_URL = `${developerForum.getBaseUrl()}/t/strengthening-our-safety-policies-and-tools/3882864`;
// Mirrors the "View violation details" destination already used elsewhere in creator-hub
// (e.g. CommerceProductsTable) when no specific reviewTaskId is available.
const REPORT_APPEALS_URL = `https://www.${process.env.robloxSiteDomain ?? 'roblox.com'}/report-appeals`;

interface RestrictedExperienceBannerProps {
  isRestricted: boolean;
  isDiscoveryBlocked: boolean;
}

/**
 * Top-of-page banner shown on the audience-reach page when the place's safety status
 * is currently constraining audience reach beyond what the eligibility signals capture:
 * - "Restricted" (userPlayabilityRestrictions ∈ {RestrictedForAll, RestrictedToOwner})
 *   takes precedence — the experience is unplayable, no audience reach possible.
 * - Otherwise, "Not discoverable" (discoveryBlocked) — playable but hidden from
 *   discovery surfaces, so reach is limited to direct links.
 */
const RestrictedExperienceBanner: FC<RestrictedExperienceBannerProps> = ({
  isRestricted,
  isDiscoveryBlocked,
}) => {
  const { translate } = useTranslation();

  if (!isRestricted && !isDiscoveryBlocked) {
    return null;
  }

  if (isRestricted) {
    return (
      <FeedbackBanner
        title={translate('Heading.GameUnplayable')}
        description={translate('Description.GameUnplayable')}
        actions={
          <Button
            variant='Standard'
            size='Small'
            as='a'
            href={REPORT_APPEALS_URL}
            target='_blank'
            rel='noopener noreferrer'>
            {translate('Action.ViewViolation')}
          </Button>
        }
        layout='Inline'
        variant='Emphasis'
        severity='Error'
      />
    );
  }

  return (
    <FeedbackBanner
      title={translate('Heading.NonDiscoverableExperience')}
      description={translate('Description.NonDiscoverableExperience')}
      actions={
        <Button
          variant='Standard'
          size='Small'
          as='a'
          href={SAFETY_POLICY_FORUM_URL}
          target='_blank'
          rel='noopener noreferrer'>
          {translate('Action.LearnMore')}
        </Button>
      }
      layout='Inline'
      variant='Emphasis'
      severity='Warning'
    />
  );
};

export default RestrictedExperienceBanner;
