import { useMemo, type FC } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { OwnerType } from '@rbx/client-commerce-api/v1';
import { CreatorTierEnum } from '@rbx/client-core-content-api/v1';
import { TransactionVariantEnum } from '@rbx/client-core-content-transaction-api/v1';
import { useFlag } from '@rbx/flags';
import { useTranslation, withTranslation } from '@rbx/intl';
import { enableExpeditedReview } from '@generated/flags/creatorGameops';
import { useAuthentication } from '@modules/authentication/providers';
import groupsClient from '@modules/clients/groups';
import useExperienceOwner from '@modules/commerce/hooks/useExperienceOwner';
import { PageLoading } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { ContentThresholdMaxScore } from '../constants/audienceReachConstants';
import { useAudienceReachData } from '../hooks/useAudienceReachData';
import { useCoreContentTransactionStatus } from '../hooks/useCoreContentTransactionStatus';
import AudienceReachExpediteConfirmationBanner from './AudienceReachExpediteConfirmationBanner';
import ContentRatingCard from './ContentRatingCard';
import HighlyEngagedPlayersCard from './HighlyEngagedPlayersCard';
import OverallReachCard from './OverallReachCard';
import PublishingFeeCard from './PublishingFeeCard';
import PublishingReachCard from './PublishingReachCard';
import ReachSection from './ReachSection';
import RestrictedExperienceBanner from './RestrictedExperienceBanner';
import UnderReviewBanner from './UnderReviewBanner';

const officialGroupOfRobloxId = 1200769;

const useIsEmployee = (): boolean => {
  const isProductionTarget = process.env.targetEnvironment === 'production';
  const { user } = useAuthentication();

  const { data: isEmployeeByGroup } = useQuery({
    queryKey: ['CheckIfSignedInUserIsEmployee', user?.id],
    queryFn: () =>
      groupsClient
        .getGroupMembershipMetadata({
          groupId: officialGroupOfRobloxId,
          includeNotificationPreferences: false,
        })
        .then((data) => !!data?.userRole?.role?.rank),
    enabled: !!user?.id,
    staleTime: Infinity,
  });

  return isEmployeeByGroup === true || !isProductionTarget;
};

const AudienceReachPage: FC = () => {
  const intl = useTranslation();
  const { translate } = intl;
  const router = useRouter();
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id ?? 0;

  const { isExperienceOwner, isFetched: isOwnerFetched, ownerType, ownerId } = useExperienceOwner();
  const isEmployee = useIsEmployee();
  const isInternalAnalyticsAdmin = isEmployee;
  const canActAsCreatorForAudienceReach = isExperienceOwner || isInternalAnalyticsAdmin;
  const shouldUseEligibilityOverride = isInternalAnalyticsAdmin && !isExperienceOwner;
  const creatorType = (gameDetails?.creator?.type ?? ownerType).toLowerCase();
  const isGroupOwnedExperience = creatorType === OwnerType.Group.toLowerCase();
  const isUserOwnedExperience = creatorType === OwnerType.User.toLowerCase();
  const { data: groupOwnerUserId, isFetched: isGroupOwnerUserIdFetched } = useQuery({
    queryKey: ['audienceReachGroupOwnerUserId', ownerId],
    queryFn: async (): Promise<number | undefined> => {
      const groupInfoResponse = await groupsClient.getGroupInfo(ownerId);
      return groupInfoResponse.owner?.userId;
    },
    enabled: shouldUseEligibilityOverride && isGroupOwnedExperience && ownerId > 0,
    retry: false,
  });
  const { ready: areFlagsLoaded, value: isExpeditedReviewEnabled } = useFlag(enableExpeditedReview);

  const universeCreatorUserId = isUserOwnedExperience ? ownerId : groupOwnerUserId;
  const isUniverseCreatorUserIdFetched = isUserOwnedExperience
    ? ownerId > 0
    : !isGroupOwnedExperience || isGroupOwnerUserIdFetched;
  const isEligibilityContextReady = !shouldUseEligibilityOverride || isUniverseCreatorUserIdFetched;
  const creatorEligibilityOverrideUserId = shouldUseEligibilityOverride
    ? universeCreatorUserId
    : undefined;

  const { state, isLoading, isError, isRestricted, isDiscoveryBlocked } =
    useAudienceReachData(universeId);

  const { data: expeditedTransactionStatus, isLoading: isTransactionsLoading } =
    useCoreContentTransactionStatus(universeId, TransactionVariantEnum.Expedited);
  const expeditedIsPaid = expeditedTransactionStatus?.hasDeposit ?? false;

  // Banner that displays your review status whenever the user has reached select eligibility
  const confirmationBanner = useMemo(() => {
    if (isTransactionsLoading || !areFlagsLoaded || !state) {
      return null;
    }
    if (expeditedIsPaid && isExpeditedReviewEnabled) {
      return (
        <AudienceReachExpediteConfirmationBanner
          universeId={universeId}
          isUnderReview={state.underReview}
        />
      );
    }
    return <UnderReviewBanner selectStatus={state.selectStatus} underReview={state.underReview} />;
  }, [
    isTransactionsLoading,
    expeditedIsPaid,
    state,
    universeId,
    isExpeditedReviewEnabled,
    areFlagsLoaded,
  ]);

  const effectiveCreatorTier =
    state?.creatorTier === CreatorTierEnum.Trusted && state?.creatorEveryoneWithoutSubscription
      ? CreatorTierEnum.Everyone
      : state?.creatorTier;

  if (isError) {
    return (
      <FailureView
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={() => router.reload()}
      />
    );
  }

  if (isLoading || !isOwnerFetched || !state) {
    return <PageLoading />;
  }

  // Hopefully temporary, we'd like to add a more solid check than 'is progress bar at 100%' but do
  // not have an API alternative at the moment
  const isBelowThreshold = state.selectIndicator < ContentThresholdMaxScore;

  return (
    <div className='flex flex-col gap-xxlarge'>
      {confirmationBanner}
      <RestrictedExperienceBanner
        isRestricted={isRestricted}
        isDiscoveryBlocked={isDiscoveryBlocked}
      />
      <p className='text-body-medium margin-none'>
        {translate('Description.AudienceReach', {
          experienceName: gameDetails?.name ?? '',
        })}
      </p>
      <OverallReachCard reachLevel={state.reachLevel} universeId={universeId} />
      <ReachSection heading={translate('Heading.AccountReach')}>
        <PublishingReachCard
          creatorTier={effectiveCreatorTier ?? CreatorTierEnum.Private}
          selectStatus={state.selectStatus}
          selectReasons={state.selectReasons}
          contentMinimumAge={state.contentRating.minimumAge}
          isPrivate={state.isPrivate}
          isGroupOwnedExperience={isGroupOwnedExperience}
          isCreator={isExperienceOwner}
          isPublishedToGatedAudience={state.isPublishedToGatedAudience}
        />
      </ReachSection>
      <ReachSection heading={translate('Heading.ExperienceReach')}>
        <ContentRatingCard
          contentRating={state.contentRating}
          isPrivate={state.isPrivate}
          universeId={String(universeId)}
        />
        <PublishingFeeCard
          isCreator={canActAsCreatorForAudienceReach}
          isBelowThreshold={isBelowThreshold}
          creatorEligibilityOverrideUserId={creatorEligibilityOverrideUserId}
          isEligibilityContextReady={isEligibilityContextReady}
          audienceReach={state.reachLevel}
          isRated={!state.contentRating.isUnrated}
          is16Plus={state.contentRating.minimumAge >= 16}
          isAccountAllAgesTier={state.creatorTier === CreatorTierEnum.Everyone}
        />
        <HighlyEngagedPlayersCard
          selectStatus={state.selectStatus}
          selectReasons={state.selectReasons}
          contentMinimumAge={state.contentRating.minimumAge}
          isPrivate={state.isPrivate}
          isUnrated={state.contentRating.isUnrated}
          score={state.selectIndicator}
          lastUpdated={state.indicatorLastUpdated}
          barColor={state.thresholdBarColor}
          daysRemaining={state.thresholdDaysRemaining}
          isExempt={expeditedIsPaid}
        />
      </ReachSection>
    </div>
  );
};

export default withTranslation(AudienceReachPage, [
  TranslationNamespace.AudienceReach,
  TranslationNamespace.PublicPublish,
  TranslationNamespace.Navigation,
]);
