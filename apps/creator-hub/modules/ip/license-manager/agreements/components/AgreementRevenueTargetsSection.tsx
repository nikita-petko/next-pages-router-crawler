import type { FunctionComponent } from 'react';
import { useEffect, useMemo } from 'react';
import { AgreementStatus, RevenueTargetType } from '@rbx/client-content-licensing-api/v1';
import { Alert, Link, ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '../../utils/logger';
import { useGetRevenueTargetsByAgreement } from '../hooks/useGetRevenueTargetsByAgreement';
import CollectibleRevenueTargetGrid from './CollectibleRevenueTargetGrid';
import {
  getAgreementStatusAnalyticsValue,
  type AgreementRevenueTargetsAudience,
  type AgreementRevenueTargetsFeature,
} from './revenueTargetAnalytics';
import RevenueTargetGrid from './RevenueTargetGrid';

interface AgreementRevenueTargetsSectionProps {
  agreementId?: string;
  agreementStatus?: AgreementStatus;
  audience: AgreementRevenueTargetsAudience;
  marketplaceEmptyStateAudience?: 'creator' | 'iph';
  showMonetizationLinks?: boolean;
  universeId?: number;
}

/** Fetches and displays agreement revenue targets on either agreement details surface. */
const AgreementRevenueTargetsSection: FunctionComponent<AgreementRevenueTargetsSectionProps> = ({
  agreementId,
  agreementStatus,
  audience,
  marketplaceEmptyStateAudience,
  showMonetizationLinks = false,
  universeId,
}) => {
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { logEvent } = useLicenseManagerLogger();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const feature: AgreementRevenueTargetsFeature =
    marketplaceEmptyStateAudience == null ? 'inGameSalesLicensing' : 'avatarItemLicensing';
  const isMarketplaceAwaitingDecision =
    marketplaceEmptyStateAudience != null &&
    (agreementStatus === AgreementStatus.Inquired || agreementStatus === AgreementStatus.Draft);
  const isInvalidMarketplaceStatus =
    marketplaceEmptyStateAudience != null &&
    (agreementStatus == null ||
      agreementStatus === AgreementStatus.None ||
      agreementStatus === AgreementStatus.Invalid);
  const revenueTargetsQuery = useGetRevenueTargetsByAgreement({
    agreementId,
    enabled: !isMarketplaceAwaitingDecision && !isInvalidMarketplaceStatus,
  });
  const { collectibles, developerProducts, gamePasses } = useMemo(() => {
    const revenueTargets = revenueTargetsQuery.data ?? [];
    return {
      collectibles: revenueTargets.filter(
        ({ revenueTargetType }) => revenueTargetType === RevenueTargetType.Collectible,
      ),
      developerProducts: revenueTargets.filter(
        ({ revenueTargetType }) => revenueTargetType === RevenueTargetType.DeveloperProduct,
      ),
      gamePasses: revenueTargets.filter(
        ({ revenueTargetType }) => revenueTargetType === RevenueTargetType.GamePass,
      ),
    };
  }, [revenueTargetsQuery.data]);
  const isClosedMarketplaceAgreement =
    marketplaceEmptyStateAudience != null &&
    (agreementStatus === AgreementStatus.Cancelled || agreementStatus === AgreementStatus.Archived);
  const isInactiveMarketplaceAgreement =
    marketplaceEmptyStateAudience != null &&
    (agreementStatus === AgreementStatus.Expired || agreementStatus === AgreementStatus.Terminated);
  const gridAnalyticsContext = useMemo(
    () => ({ agreementStatus, audience }),
    [agreementStatus, audience],
  );
  const displayState = (() => {
    if (isInvalidMarketplaceStatus) {
      return 'invalidStatus';
    }
    if (isMarketplaceAwaitingDecision) {
      return 'awaitingDecision';
    }
    if (revenueTargetsQuery.isPending) {
      return 'loading';
    }
    if (revenueTargetsQuery.isError) {
      return 'error';
    }
    if (revenueTargetsQuery.data?.length === 0) {
      if (isInactiveMarketplaceAgreement) {
        return 'inactiveEmpty';
      }
      if (isClosedMarketplaceAgreement) {
        return 'closedEmpty';
      }
      return 'empty';
    }
    if (isInactiveMarketplaceAgreement) {
      return 'inactiveWithItems';
    }
    if (isClosedMarketplaceAgreement) {
      return 'closedWithItems';
    }
    return 'items';
  })();
  const agreementStatusAnalyticsValue = getAgreementStatusAnalyticsValue(agreementStatus);

  useEffect(() => {
    if (displayState === 'loading') {
      return;
    }

    const analyticsParameters = {
      agreementStatus: agreementStatusAnalyticsValue,
      audience,
      avatarItemTargetCount: collectibles.length,
      developerProductTargetCount: developerProducts.length,
      displayState,
      feature,
      featureFlagEnabled: true,
      gamePassTargetCount: gamePasses.length,
      returnedTargetCount: revenueTargetsQuery.data?.length ?? 0,
    };
    const dedupeKey = `${agreementId ?? 'missing'}:${audience}:${feature}:${displayState}`;

    logOnce(
      LicenseManagerImpressionEvent.AgreementRevenueTargetsSectionImpressionEvent,
      analyticsParameters,
      dedupeKey,
    );
    if (displayState === 'error') {
      logOnce(
        LicenseManagerImpressionEvent.AgreementRevenueTargetResolutionFailureImpressionEvent,
        { ...analyticsParameters, resolutionStage: 'listRevenueTargets' },
        dedupeKey,
      );
    }
  }, [
    agreementId,
    agreementStatusAnalyticsValue,
    audience,
    collectibles.length,
    developerProducts.length,
    displayState,
    feature,
    gamePasses.length,
    logOnce,
    revenueTargetsQuery.data?.length,
  ]);

  if (isInvalidMarketplaceStatus) {
    return (
      <Alert
        className='self-start !width-fit max-width-full'
        severity='Error'
        variant='Feedback'
        hasCloseAffordance={false}>
        {translate('Error.LoadingData')}
      </Alert>
    );
  }

  if (isMarketplaceAwaitingDecision) {
    return (
      <Typography variant='body1'>
        {marketplaceEmptyStateAudience === 'creator'
          ? tPendingTranslation(
              'If your license request is accepted, you will then be able to select this license to attach to an avatar item at the time of publishing the item.',
              'Description shown to creators in the creation details section while their Avatar Marketplace license request is awaiting rights holder acceptance.',
              translationKey(
                'Description.InquiredMarketplaceSalesCreator',
                TranslationNamespace.AgreementsManager,
              ),
            )
          : tPendingTranslation(
              'If you accept this license request, then the creator will be able to select this license to attach to an avatar item at the time of publishing the item.',
              'Description shown to rights holders in the creation details section while an Avatar Marketplace license request awaits their acceptance.',
              translationKey(
                'Description.InquiredMarketplaceSalesIph',
                TranslationNamespace.AgreementsManager,
              ),
            )}
      </Typography>
    );
  }

  if (revenueTargetsQuery.isPending) {
    return (
      <div className='flex justify-center padding-large'>
        <ProgressCircle
          variant='Indeterminate'
          ariaLabel={translate('Label.Loading')}
          size='Medium'
        />
      </div>
    );
  }

  if (revenueTargetsQuery.isError) {
    return (
      <Alert
        className='self-start !width-fit max-width-full'
        severity='Error'
        variant='Feedback'
        hasCloseAffordance={false}>
        {translate('Error.LoadingData')}
      </Alert>
    );
  }

  const canAttachLicense =
    agreementStatus === AgreementStatus.Pending ||
    agreementStatus === AgreementStatus.Disputed ||
    agreementStatus === AgreementStatus.Unsuccessful ||
    agreementStatus === AgreementStatus.Active ||
    agreementStatus === AgreementStatus.Accepted ||
    agreementStatus === AgreementStatus.ConditionalOffer;
  if (
    revenueTargetsQuery.data?.length === 0 &&
    marketplaceEmptyStateAudience != null &&
    canAttachLicense
  ) {
    return (
      <Typography variant='body1'>
        {marketplaceEmptyStateAudience === 'creator'
          ? tPendingTranslation(
              'You may now select this license to attach to an avatar item at the time of publishing the item.',
              'Description shown to creators in their creation details section on the license agreement details page to inform them that they are now able to attach this license to future-published avatar items.',
              translationKey(
                'Description.NoAvatarItemsYetCreator',
                TranslationNamespace.AgreementsManager,
              ),
            )
          : tPendingTranslation(
              'The creator has not yet published an avatar item using this license. Check back later.',
              'Description shown to rights holders in the creation details section on the license agreement details page if the creator has not yet attached this license to any newly-published avatar items.',
              translationKey(
                'Description.NoAvatarItemsYetIph',
                TranslationNamespace.AgreementsManager,
              ),
            )}
      </Typography>
    );
  }

  const validUniverseId =
    universeId !== undefined && Number.isFinite(universeId) && universeId > 0
      ? universeId
      : undefined;
  const developerProductsHref =
    showMonetizationLinks && validUniverseId !== undefined
      ? dashboard.getMonetizationDeveloperProductsUrl(validUniverseId)
      : undefined;
  const gamePassesHref =
    showMonetizationLinks && validUniverseId !== undefined
      ? dashboard.getMonetizationPassesUrl(validUniverseId)
      : undefined;
  return (
    <>
      {marketplaceEmptyStateAudience != null && isClosedMarketplaceAgreement && (
        <Alert
          className='self-start !width-fit max-width-full margin-bottom-medium'
          severity='Info'
          variant='Feedback'
          hasCloseAffordance={false}>
          {agreementStatus === AgreementStatus.Cancelled
            ? tPendingTranslation(
                'This license agreement was cancelled, so no avatar items can be attached to it.',
                'Description shown in Marketplace creation details for a cancelled license agreement.',
                translationKey(
                  'Description.CancelledMarketplaceSales',
                  TranslationNamespace.AgreementsManager,
                ),
              )
            : tPendingTranslation(
                'This license agreement was closed, so no avatar items can be attached to it.',
                'Description shown in Marketplace creation details for an archived license agreement.',
                translationKey(
                  'Description.ArchivedMarketplaceSales',
                  TranslationNamespace.AgreementsManager,
                ),
              )}
        </Alert>
      )}

      {isInactiveMarketplaceAgreement && (
        <Alert
          className='self-start !width-fit max-width-full margin-bottom-medium'
          severity='Info'
          variant='Feedback'
          hasCloseAffordance={false}>
          {collectibles.length > 0
            ? tPendingTranslation(
                'This license agreement is no longer active, so the following avatar items have been taken off-sale.',
                'Notice shown above avatar items in the creation details section when their Avatar Marketplace license agreement has expired or terminated.',
                translationKey(
                  'Description.NoLongerActiveMarketplaceSales',
                  TranslationNamespace.AgreementsManager,
                ),
              )
            : tPendingTranslation(
                'This license agreement was closed without having any avatar items attached to it.',
                'Notice shown in the creation details section when an Avatar Marketplace license agreement expired or terminated without any avatar items attached.',
                translationKey(
                  'Description.InactiveMarketplaceSalesWithoutItems',
                  TranslationNamespace.AgreementsManager,
                ),
              )}
        </Alert>
      )}

      {collectibles.length > 0 && (
        <CollectibleRevenueTargetGrid
          analyticsContext={gridAnalyticsContext}
          revenueTargets={collectibles}
        />
      )}

      {developerProducts.length > 0 && (
        <section className='flex flex-col gap-medium'>
          {developerProductsHref ? (
            <Link
              href={developerProductsHref}
              onClick={() =>
                logEvent(LicenseManagerClickEvent.AgreementRevenueTargetManagementLinkClickEvent, {
                  agreementStatus: agreementStatusAnalyticsValue,
                  audience,
                  feature,
                  featureFlagEnabled: true,
                  targetType: 'developerProduct',
                })
              }
              target='_blank'
              rel='noopener noreferrer'
              isExternal
              color='Standard'
              underline='none'>
              <Typography variant='h6'>{translate('Label.DeveloperProducts')}</Typography>
            </Link>
          ) : (
            <Typography variant='h6'>{translate('Label.DeveloperProducts')}</Typography>
          )}
          <RevenueTargetGrid
            analyticsContext={gridAnalyticsContext}
            revenueTargets={developerProducts}
            targetType='developerProduct'
            universeId={universeId}
          />
        </section>
      )}

      {gamePasses.length > 0 && (
        <section className='flex flex-col gap-medium'>
          {gamePassesHref ? (
            <Link
              href={gamePassesHref}
              onClick={() =>
                logEvent(LicenseManagerClickEvent.AgreementRevenueTargetManagementLinkClickEvent, {
                  agreementStatus: agreementStatusAnalyticsValue,
                  audience,
                  feature,
                  featureFlagEnabled: true,
                  targetType: 'gamePass',
                })
              }
              target='_blank'
              rel='noopener noreferrer'
              isExternal
              color='Standard'
              underline='none'>
              <Typography variant='h6'>{translate('Label.GamePasses')}</Typography>
            </Link>
          ) : (
            <Typography variant='h6'>{translate('Label.GamePasses')}</Typography>
          )}
          <RevenueTargetGrid
            analyticsContext={gridAnalyticsContext}
            revenueTargets={gamePasses}
            targetType='gamePass'
            universeId={universeId}
          />
        </section>
      )}
    </>
  );
};

export default AgreementRevenueTargetsSection;
