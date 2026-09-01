import { useMemo, type FC } from 'react';
import { useRouter } from 'next/router';
import { AllowlistTypeEnum, CreatorTierEnum } from '@rbx/client-core-content-api/v1';
import { TransactionVariantEnum } from '@rbx/client-core-content-transaction-api/v1';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import { PageLoading } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useAudienceReachData } from '../hooks/useAudienceReachData';
import { useCoreContentTransactionStatus } from '../hooks/useCoreContentTransactionStatus';
import { useGroupOwnerUserId } from '../hooks/useGroupOwnerUserId';
import AudienceReachExpediteConfirmationBanner from './AudienceReachExpediteConfirmationBanner';
import ContentRatingCard from './ContentRatingCard';
import HighlyEngagedPlayersCard from './HighlyEngagedPlayersCard';
import OverallReachCard from './OverallReachCard';
import PublishingFeeCard from './PublishingFeeCard';
import PublishingReachCard from './PublishingReachCard';
import ReachSection from './ReachSection';
import RestrictedExperienceBanner from './RestrictedExperienceBanner';
import UnderReviewBanner from './UnderReviewBanner';

const AudienceReachPage: FC = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { gameDetails, isLoadingGame, isErrorLoadingGame } = useCurrentGame();
  const universeId = gameDetails?.id ?? 0;

  // Assemble game ownership info
  const { user, isFetched: isUserFetched } = useAuthentication();
  const ownerId = gameDetails?.creator?.id ?? 0;
  const isGroupOwnedExperience = gameDetails?.creator?.type === CreatorType.Group;
  const { groupOwnerUserId, isGroupOwnerUserIdFetched } = useGroupOwnerUserId(
    isGroupOwnedExperience ? ownerId : undefined,
  );
  const isExperienceOwner = isGroupOwnedExperience
    ? groupOwnerUserId === user?.id
    : ownerId === user?.id;
  const isOwnerFetched = !isGroupOwnedExperience || isGroupOwnerUserIdFetched;

  const { state, isLoading, isError, isRestricted, isDiscoveryBlocked } =
    useAudienceReachData(universeId);
  const { data: expeditedTransactionStatus, isLoading: isTransactionsLoading } =
    useCoreContentTransactionStatus(universeId, TransactionVariantEnum.Expedited);
  const expeditedIsPaid = expeditedTransactionStatus?.hasDeposit ?? false;
  const isAllowlistedExempt =
    state !== null &&
    (Boolean(state.activeAllowlists?.includes(AllowlistTypeEnum.UniverseBypass)) ||
      Boolean(state.activeAllowlists?.includes(AllowlistTypeEnum.TemporaryExpeditedFeeBypass)));

  // Banner that displays your review status whenever the user has reached select eligibility
  const confirmationBanner = useMemo(() => {
    if (isTransactionsLoading || !state) {
      return null;
    }
    if (expeditedIsPaid) {
      return (
        <AudienceReachExpediteConfirmationBanner
          universeId={universeId}
          isUnderReview={state.underReview}
        />
      );
    }
    return <UnderReviewBanner selectStatus={state.selectStatus} underReview={state.underReview} />;
  }, [isTransactionsLoading, expeditedIsPaid, state, universeId]);

  const effectiveCreatorTier =
    state?.creatorTier === CreatorTierEnum.Trusted && state?.creatorEveryoneWithoutSubscription
      ? CreatorTierEnum.Everyone
      : state?.creatorTier;

  if (isError || isErrorLoadingGame) {
    return (
      <FailureView
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={() => router.reload()}
      />
    );
  }

  if (isLoading || isLoadingGame || !isOwnerFetched || !isUserFetched) {
    return <PageLoading />;
  }

  if (!state) {
    // The batch endpoint omits games the user does not have access to.  We call with one universe,
    // so if the response is empty that means the user doesn't have access.  This should actually be
    // redundant with the permission checks on audience-reach.tsx, but in case something gets desynced
    // in the backend this ensures the user doesn't get the endless loading spinner.
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  // Hopefully temporary, we'd like to add a more solid check than 'is progress bar at 100%' but do
  // not have an API alternative at the moment
  const isBelowThreshold = state.selectIndicator < state.thresholdTrigger;

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
          isCreator={isExperienceOwner}
          isBelowThreshold={isBelowThreshold}
          audienceReach={state.reachLevel}
          isAccountAllAgesTier={effectiveCreatorTier === CreatorTierEnum.Everyone}
          activeAllowlists={state.activeAllowlists}
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
          isExempt={expeditedIsPaid || isAllowlistedExempt}
          thresholdTrigger={state.thresholdTrigger}
          thresholdReset={state.thresholdReset}
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
