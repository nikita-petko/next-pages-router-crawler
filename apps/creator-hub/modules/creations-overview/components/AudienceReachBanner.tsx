import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import router from 'next/router';
import {
  AgeBracketEnum,
  CreatorEligibilityEnum,
  ReasonEnum,
  SelectStatusEnum,
} from '@rbx/client-core-content-api/v1';
import { TransactionVariantEnum } from '@rbx/client-core-content-transaction-api/v1';
import type { TButtonProps, TFeedbackBannerProps } from '@rbx/foundation-ui';
import { Button, FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useMediaQuery } from '@rbx/ui';
import { useAudienceReachData } from '@modules/audience-reach/hooks/useAudienceReachData';
import { useContentRatingDetails } from '@modules/audience-reach/hooks/useContentRatingDetails';
import { useCoreContentTransactionStatus } from '@modules/audience-reach/hooks/useCoreContentTransactionStatus';
import { ThresholdBarColor } from '@modules/audience-reach/types/audienceReach';
import useLocale from '@modules/charts-generic/context/useLocale';
import useExperienceOwner from '@modules/commerce/hooks/useExperienceOwner';
import { Audience } from '@modules/creations/common/audiences';
import { ExperienceSafetyStatus } from '@modules/experience-analytics-shared/enums/ExperienceSafetyStatus';
import useGetExperienceSafetyStatus from '@modules/experience-analytics-shared/hooks/useGetExperienceSafetyStatus';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCreatorEligibility } from '@modules/publishing-permissions/hooks/useCreatorEligibility';
import { useGetUniverseConfiguration } from '@modules/react-query/develop';

const ALL_REQUIREMENTS: CreatorEligibilityEnum[] = [
  CreatorEligibilityEnum.IdVerified,
  CreatorEligibilityEnum.AgeEstimationVerified,
  CreatorEligibilityEnum.Has2SvEnabled,
  CreatorEligibilityEnum.HasActiveSubscription,
  CreatorEligibilityEnum.ModerationStatusOk,
];

const ALL_REQUIREMENTS_VIETNAM: CreatorEligibilityEnum[] = [
  CreatorEligibilityEnum.ModerationStatusOk,
  CreatorEligibilityEnum.PhoneVerified,
  CreatorEligibilityEnum.IdVerified,
];

const buttonProps: TButtonProps = {
  variant: 'Standard',
  size: 'Small',
  className: 'width-fit',
  as: 'a',
};

const AudienceReachBanner: FC = () => {
  const { translate } = useTranslation();
  const [shouldShow, setShouldShow] = useState(true); // for X button
  const universeId = typeof router.query.id === 'string' ? parseInt(router.query.id) : 0;
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const { data: universeConfig, isLoading: isUniverseConfigLoading } =
    useGetUniverseConfiguration(universeId);
  const audiences = universeConfig?.audiences;
  const isEditorsOnly = audiences?.length === 1 && audiences[0] === Audience.Editors;

  //
  // API calls
  //

  const { data: contentRating } = useContentRatingDetails(universeId);
  const safetyStatus = useGetExperienceSafetyStatus();
  const { state: audienceReach, isLoading: isAudienceReachLoading } =
    useAudienceReachData(universeId);
  const { data: creatorEligibility } = useCreatorEligibility();
  const { isExperienceOwner, isFetched: isOwnerFetched } = useExperienceOwner();
  const locale = useLocale();
  const { data: expeditedTransactionStatus, isLoading: isTransactionsLoading } =
    useCoreContentTransactionStatus(universeId, TransactionVariantEnum.Expedited);
  const expeditedIsPaid = expeditedTransactionStatus?.hasDeposit ?? false;

  //
  // CTA button logic
  //

  const viewDetailsButton = useMemo(
    () => (
      <Button
        href={`/dashboard/creations/experiences/${universeId}/audience-reach`}
        {...buttonProps}>
        {translate('Action.ViewDetails')}
      </Button>
    ),
    [universeId, translate],
  );
  const engagementButton = useMemo(
    () => (
      <Button
        href='/docs/production/publishing/kids-and-select#publishing-requirements'
        {...buttonProps}>
        {translate('Action.IncreaseEngagement')}
      </Button>
    ),
    [translate],
  );
  const questionnaireButton = useMemo(
    () => (
      <Button
        href={`/dashboard/creations/experiences/${universeId}/experience-questionnaire`}
        {...buttonProps}>
        {translate('Action.ViewQuestionnaire')}
      </Button>
    ),
    [universeId, translate],
  );
  const reasonToCta = useCallback(
    (reason: CreatorEligibilityEnum) => {
      switch (reason) {
        case CreatorEligibilityEnum.AgeEstimationVerified:
          return (
            <Button
              href={`https://${process.env.robloxSiteDomain}/my/account?ageVerification#!/info`}
              {...buttonProps}>
              {translate('Action.CompleteAgeCheck')}
            </Button>
          );
        case CreatorEligibilityEnum.Has2SvEnabled:
          return (
            <Button
              href={`https://${process.env.robloxSiteDomain}/my/account#!/security`}
              {...buttonProps}>
              {translate('Action.AddTwoStepVerification')}
            </Button>
          );
        case CreatorEligibilityEnum.IdVerified:
          if (creatorEligibility?.ageBracket === AgeBracketEnum.Over18) {
            return (
              <Button
                href={`https://${process.env.robloxSiteDomain}/my/account?idVerification#!/info`}
                {...buttonProps}>
                {translate('Action.VerifyId')}
              </Button>
            );
          }
          if (creatorEligibility?.ageBracket === AgeBracketEnum.Under13) {
            return (
              <Button
                href={`https://${process.env.robloxSiteDomain}/my/account?addParent#!/parental-controls`}
                {...buttonProps}>
                {translate('Action.GetParentPermission')}
              </Button>
            );
          }
          // For users between 13 and 18, we direct them to Publishing Permissions since the CTA is more complicated
          return undefined;
        case CreatorEligibilityEnum.ModerationStatusOk:
        case CreatorEligibilityEnum.PhoneVerified:
        case CreatorEligibilityEnum.HasActiveSubscription:
        case CreatorEligibilityEnum.HasRobloxPremium:
        default:
          return undefined;
      }
    },
    [translate, creatorEligibility],
  );

  const requirementsButtons = useMemo(() => {
    if (!creatorEligibility) {
      return viewDetailsButton;
    }

    // The creator eligibility endpoint returns which requirements the creator
    // has satisfied rather than the ones they have not, so we subtract those
    // from the full list of requirements to determine which ones they still
    // need to fulfill.  List may be empty for the subscription/deposit requirement.
    const outstandingRequirements: CreatorEligibilityEnum[] = [];
    if (creatorEligibility?.countryCode === 'VN') {
      ALL_REQUIREMENTS_VIETNAM.forEach((requirement) => {
        if (!creatorEligibility.creatorEligibility.includes(requirement)) {
          outstandingRequirements.push(requirement);
        }
      });
    } else {
      ALL_REQUIREMENTS.forEach((requirement) => {
        if (!creatorEligibility.creatorEligibility.includes(requirement)) {
          outstandingRequirements.push(requirement);
        }
      });
    }

    if (outstandingRequirements.length === 0) {
      // Backup is always to send them to the creator eligibility page
      return viewDetailsButton;
    }
    if (outstandingRequirements.length === 1) {
      return reasonToCta(outstandingRequirements[0]) ?? viewDetailsButton;
    }
    if (outstandingRequirements.length === 2) {
      if (!reasonToCta(outstandingRequirements[0]) && !reasonToCta(outstandingRequirements[1])) {
        // It's possible neither requirement has a linked action, so we capture that case here
        return viewDetailsButton;
      }
      return (
        <div className='flex gap-small'>
          {reasonToCta(outstandingRequirements[0])}
          {reasonToCta(outstandingRequirements[1])}
        </div>
      );
    }
    // Too many reasons to include in the banner, so just send them to the dedicated page for
    // the ones that don't fit in the banner
    return (
      <div className='flex gap-small'>
        {reasonToCta(outstandingRequirements[0])}
        {viewDetailsButton}
      </div>
    );
  }, [creatorEligibility, viewDetailsButton, reasonToCta]);

  // For sequestered CTA
  const messageInboxButton = (
    <Button href={`https://${process.env.robloxSiteDomain}/my/messages/#!/inbox`} {...buttonProps}>
      {translate('Action.ViewViolation')}
    </Button>
  );

  //
  // Banner cases
  //

  const sharedBannerProps: Partial<TFeedbackBannerProps> = useMemo(() => {
    return {
      variant: 'Emphasis',
      onDismiss: () => setShouldShow(false),
      className: 'width-full',
      layout: isMobile ? 'Stacked' : 'Inline',
    };
  }, [isMobile]);

  // Private experiences are expected to have no audience
  if (!shouldShow || isAudienceReachLoading || isUniverseConfigLoading || isEditorsOnly) {
    return undefined;
  }

  // Variant: Universe is unrated
  if (contentRating?.isUnrated) {
    return (
      <FeedbackBanner
        title={translate('Heading.GameUnplayable')}
        description={translate('Description.GameUnplayableUnrated')}
        actions={questionnaireButton}
        severity='Error'
        {...sharedBannerProps}
        onDismiss={undefined} // Not dismissable
      />
    );
  }

  // Variant: Universe is sequestered, unplayable
  if (
    safetyStatus === ExperienceSafetyStatus.Red ||
    safetyStatus === ExperienceSafetyStatus.Orange
  ) {
    return (
      <FeedbackBanner
        title={translate('Heading.GameUnplayable')}
        description={translate('Description.GameUnplayablePolicyViolation')}
        actions={messageInboxButton}
        severity='Error'
        {...sharedBannerProps}
        onDismiss={undefined} // Sequestered banners are not dismissable
      />
    );
  }

  // Variant: Universe is sequestered, undiscoverable
  if (safetyStatus === ExperienceSafetyStatus.Yellow) {
    return (
      <FeedbackBanner
        title={translate('Heading.GameNotDiscoverable')}
        description={translate('Description.GameNotDiscoverablePolicyViolation')}
        actions={messageInboxButton}
        severity='Warning'
        {...sharedBannerProps}
        onDismiss={undefined} // Sequestered banners are not dismissable
      />
    );
  }

  // If the game is rated for 16+, it isn't Select eligible by design, so no warning is needed
  // If the user isn't the owner they cannot act on any of the requirements flag by the remaining
  // cases, so we hide the banner
  if (
    !audienceReach ||
    contentRating?.minimumAge === undefined ||
    contentRating?.minimumAge >= 16 ||
    !isExperienceOwner ||
    !isOwnerFetched ||
    isTransactionsLoading
  ) {
    return undefined;
  }

  // Variant: Not Select eligible,
  if (
    audienceReach.selectStatus === SelectStatusEnum.NotEligible &&
    !audienceReach.selectReasons.includes(ReasonEnum.Threshold)
  ) {
    return (
      <FeedbackBanner
        title={translate('Heading.ReachMorePlayers')}
        description={translate('Description.ReachMorePlayers')}
        actions={requirementsButtons}
        severity='Info'
        {...sharedBannerProps}
      />
    );
  }

  const eligibilityDeadline = new Date();
  eligibilityDeadline.setDate(eligibilityDeadline.getDate() + audienceReach.thresholdDaysRemaining);

  // Variant: Select eligible, but at risk
  // Yellow threshold bar means "still Select-eligible but Threshold reason
  // flagged" — the grace-period signal that previously lived on ReachBadge.
  if (
    audienceReach.selectStatus === SelectStatusEnum.Eligible &&
    audienceReach.thresholdBarColor === ThresholdBarColor.Yellow &&
    !expeditedIsPaid
  ) {
    return (
      <FeedbackBanner
        title={translate('Heading.ReachAtRisk')}
        description={translate('Description.ReachAtRisk', {
          date: eligibilityDeadline.toLocaleDateString(locale ?? undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        })}
        actions={engagementButton}
        severity='Warning'
        {...sharedBannerProps}
      />
    );
  }

  // No warning to show
  return undefined;
};

export default withTranslation(AudienceReachBanner, [TranslationNamespace.PublicPublish]);
