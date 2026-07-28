import type { FunctionComponent, ReactNode } from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  AgeBracketEnum,
  CreatorEligibilityEnum,
  CreatorEligibilityWarningEnum,
  CreatorTierEnum,
} from '@rbx/client-core-content-api/v1';
import { FeedbackBanner } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Link, Typography } from '@rbx/ui';
import Authenticated from '@modules/authentication/Authenticated';
import { PageLoading } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import PublishingPermissionsTable from '../components/PublishingPermissionsTable';
import { getPublishingPermissionsConfig } from '../constants/configs';
import { idVerificationActionUrl } from '../constants/tiers';
import { useCreatorEligibility } from '../hooks/useCreatorEligibility';

const learnMoreLinkChunks = [
  {
    opening: 'linkStart',
    closing: 'linkEnd',
    content: (chunks: ReactNode) => (
      <Link
        className='underline content-inherit'
        href='https://devforum.roblox.com/t/new-publishing-requirements-evaluation-process-for-games/4573166'
        target='_blank'>
        {chunks}
      </Link>
    ),
  },
];

const PublishingPermissionsPageContent: FunctionComponent = () => {
  const router = useRouter();
  const { ready: areTranslationsReady, translate, translateHTML } = useTranslation();
  const overrideUserId = useMemo(() => {
    const rawOverrideOwnerId = router.query.override_ownerId;
    const overrideOwnerId = Array.isArray(rawOverrideOwnerId)
      ? rawOverrideOwnerId[0]
      : rawOverrideOwnerId;

    if (!overrideOwnerId) {
      return undefined;
    }

    const parsedOverrideOwnerId = Number(overrideOwnerId);
    if (!Number.isInteger(parsedOverrideOwnerId) || parsedOverrideOwnerId <= 0) {
      return undefined;
    }

    return parsedOverrideOwnerId;
  }, [router.query.override_ownerId]);

  const {
    data: creatorEligibilityResponse,
    isLoading,
    isError,
    refetch,
  } = useCreatorEligibility({
    overrideUserId,
  });

  const completedRequirements = creatorEligibilityResponse?.creatorEligibility ?? [];
  const ageBracket = creatorEligibilityResponse?.ageBracket ?? AgeBracketEnum.Unknown;
  const countryCode = creatorEligibilityResponse?.countryCode;
  const creatorTier = creatorEligibilityResponse?.creatorTier ?? CreatorTierEnum.Blocked;
  const allowlistTier = creatorEligibilityResponse?.allowlistTier ?? [];
  const everyoneTierWithoutSubscription =
    creatorEligibilityResponse?.everyoneTierWithoutSubscription ?? false;

  const config = getPublishingPermissionsConfig(countryCode);

  // The Everyone tier no longer requires an active subscription, so any user currently at
  // Trusted who qualifies for Everyone without a subscription is displayed as Everyone.
  const effectiveCreatorTier =
    creatorTier === CreatorTierEnum.Trusted && everyoneTierWithoutSubscription
      ? CreatorTierEnum.Everyone
      : creatorTier;

  const showParentLinkExpirationWarning =
    creatorEligibilityResponse?.warnings?.includes(
      CreatorEligibilityWarningEnum.ParentLinkExpiration,
    ) ?? false;
  const isEligibleForPlus = completedRequirements.includes(CreatorEligibilityEnum.HasRobloxPremium);
  const approvalBannerKey = allowlistTier.includes(effectiveCreatorTier)
    ? config.approvalBannerKeys?.[effectiveCreatorTier]
    : undefined;

  if (!areTranslationsReady || isLoading) {
    return <PageLoading />;
  }

  return (
    <Authenticated>
      {isError ? (
        <FailureView
          message={translate('Message.FailedToLoadPage')}
          buttonText={translate('Action.FailedToLoadPage')}
          onReload={() => refetch()}
        />
      ) : (
        <div className='flex flex-col gap-small'>
          <Typography variant='body1' color='secondary' className='text-body-medium'>
            {translateHTML('Description.PublishingPermissionsWithLearnMore', learnMoreLinkChunks)}
          </Typography>
          {approvalBannerKey && (
            <FeedbackBanner
              title=''
              description={translate(approvalBannerKey)}
              severity='Success'
              variant='Emphasis'
              layout='Inline'
              className='margin-top-medium'
            />
          )}
          {isEligibleForPlus && (
            <FeedbackBanner
              title=''
              description={translate('Message.PlusSubscriptionEligibility')}
              severity='Success'
              variant='Emphasis'
              layout='Inline'
              primaryActionLabel={translate('Action.ViewDetails')}
              className='margin-top-medium'
              onPrimaryAction={() => {
                window.location.href = 'https://devforum.roblox.com/new-publishing-requirements';
              }}
            />
          )}
          {showParentLinkExpirationWarning && (
            <FeedbackBanner
              title=''
              description={translate('Message.LinkedParentGraduationV2')}
              severity='Warning'
              variant='Emphasis'
              layout='Inline'
              primaryActionLabel={translate('Action.Start')}
              className='margin-top-medium'
              onPrimaryAction={() => window.open(idVerificationActionUrl, '_blank')}
            />
          )}
          <PublishingPermissionsTable
            completedRequirements={completedRequirements}
            ageBracket={ageBracket}
            creatorTier={effectiveCreatorTier}
            config={config}
          />
        </div>
      )}
    </Authenticated>
  );
};

export default withTranslation(PublishingPermissionsPageContent, [
  TranslationNamespace.PublicPublish,
  TranslationNamespace.Navigation,
]);
