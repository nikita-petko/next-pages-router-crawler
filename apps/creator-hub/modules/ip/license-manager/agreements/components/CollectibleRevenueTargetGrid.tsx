import { useCallback, useEffect, useMemo } from 'react';
import type { RevenueTargetResponse } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import { Skeleton } from '@rbx/ui';
import { useVisibleImpression } from '@modules/licenses/hooks/useVisibleImpression';
import { getBundleUrl, getCatalogUrl } from '@modules/miscellaneous/urls/www';
import CellError from '../../../components/error/CellError';
import CollectibleItemTile from '../../components/CollectibleItemTile';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '../../utils/logger';
import useCollectibleMatchItemDetails from '../hooks/useCollectibleMatchItemDetails';
import { getCollectibleMatchPresentation } from './collectibleMatchPresentation';
import {
  getAgreementStatusAnalyticsValue,
  REVENUE_TARGET_GRID_IMPRESSION_VISIBILITY_THRESHOLD,
  type AgreementRevenueTargetAnalyticsContext,
} from './revenueTargetAnalytics';
import RevenueTargetTileImpression from './RevenueTargetTileImpression';

interface CollectibleRevenueTargetGridProps {
  analyticsContext: AgreementRevenueTargetAnalyticsContext;
  revenueTargets: RevenueTargetResponse[];
}

const CollectibleRevenueTargetGrid = ({
  analyticsContext,
  revenueTargets,
}: CollectibleRevenueTargetGridProps) => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const { agreementStatus, audience } = analyticsContext;
  const agreementStatusAnalyticsValue = getAgreementStatusAnalyticsValue(agreementStatus);
  const collectibleItemIds = useMemo(
    () => [
      ...new Set(
        revenueTargets
          .map(({ revenueTargetId }) => revenueTargetId?.trim())
          .filter((revenueTargetId): revenueTargetId is string => Boolean(revenueTargetId)),
      ),
    ],
    [revenueTargets],
  );
  const itemDetailsQuery = useCollectibleMatchItemDetails(collectibleItemIds);
  const displayedItems = useMemo(
    () =>
      collectibleItemIds.flatMap((collectibleItemId, itemPosition) => {
        const details = itemDetailsQuery.data?.[collectibleItemId];
        return details == null ? [] : [{ collectibleItemId, details, itemPosition }];
      }),
    [collectibleItemIds, itemDetailsQuery.data],
  );
  const impressionDedupeKey = `${audience}:${agreementStatusAnalyticsValue}:${collectibleItemIds.join('|')}`;
  const logGridImpression = useCallback(() => {
    logOnce(
      LicenseManagerImpressionEvent.AgreementRevenueTargetGridImpressionEvent,
      {
        agreementStatus: agreementStatusAnalyticsValue,
        audience,
        displayedTargetCount: displayedItems.length,
        feature: 'avatarItemLicensing',
        featureFlagEnabled: true,
        returnedTargetCount: collectibleItemIds.length,
        targetType: 'avatarItem',
      },
      impressionDedupeKey,
    );
  }, [
    agreementStatusAnalyticsValue,
    audience,
    collectibleItemIds.length,
    displayedItems,
    impressionDedupeKey,
    logOnce,
  ]);
  const gridRef = useVisibleImpression<HTMLDivElement>(
    logGridImpression,
    itemDetailsQuery.isSuccess,
    REVENUE_TARGET_GRID_IMPRESSION_VISIBILITY_THRESHOLD,
  );

  useEffect(() => {
    const hasPartialResolutionFailure =
      itemDetailsQuery.isSuccess && displayedItems.length < collectibleItemIds.length;
    if (!itemDetailsQuery.isError && !hasPartialResolutionFailure) {
      return;
    }

    logOnce(
      LicenseManagerImpressionEvent.AgreementRevenueTargetResolutionFailureImpressionEvent,
      {
        agreementStatus: agreementStatusAnalyticsValue,
        audience,
        displayedTargetCount: displayedItems.length,
        feature: 'avatarItemLicensing',
        featureFlagEnabled: true,
        resolutionStage: 'collectibleDetails',
        returnedTargetCount: collectibleItemIds.length,
        targetType: 'avatarItem',
      },
      impressionDedupeKey,
    );
  }, [
    agreementStatusAnalyticsValue,
    audience,
    collectibleItemIds.length,
    displayedItems.length,
    impressionDedupeKey,
    itemDetailsQuery.isError,
    itemDetailsQuery.isSuccess,
    logOnce,
  ]);

  if (collectibleItemIds.length === 0) {
    return null;
  }

  let items;
  if (itemDetailsQuery.isPending) {
    items = collectibleItemIds.map((collectibleItemId) => (
      <div key={collectibleItemId} className='flex flex-col gap-xsmall padding-small'>
        <div className='width-full aspect-1-1'>
          <Skeleton variant='square' width='100%' height='100%' animate />
        </div>
        <Skeleton variant='text' width='75%' animate />
        <Skeleton variant='text' width='50%' animate />
      </div>
    ));
  } else if (itemDetailsQuery.isError) {
    items = <CellError />;
  } else {
    items = collectibleItemIds.map((collectibleItemId, itemPosition) => {
      const details = itemDetailsQuery.data?.[collectibleItemId];
      if (!details) {
        return (
          <div key={collectibleItemId} className='padding-small'>
            <CellError />
          </div>
        );
      }

      const presentation = getCollectibleMatchPresentation(details);
      const href =
        presentation.targetId == null
          ? undefined
          : presentation.isBundle
            ? getBundleUrl(presentation.targetId)
            : getCatalogUrl(presentation.targetId);

      return (
        <RevenueTargetTileImpression
          key={collectibleItemId}
          analyticsContext={analyticsContext}
          dedupeKey={`${impressionDedupeKey}:${collectibleItemId}`}
          feature='avatarItemLicensing'
          itemPosition={itemPosition}
          itemType={presentation.isBundle ? 'bundle' : 'asset'}
          targetType='avatarItem'>
          <CollectibleItemTile
            thumbnailTargetId={presentation.thumbnailTargetId}
            itemType={presentation.isBundle ? 'bundle' : 'asset'}
            name={presentation.name ?? translate('Label.Unknown')}
            creatorDisplayName={presentation.creatorDisplayName}
            price={presentation.price}
            limitedType={presentation.isLimited ? 'limited' : undefined}
            href={href}
            onClick={
              href == null
                ? undefined
                : () =>
                    logEvent(LicenseManagerClickEvent.AgreementRevenueTargetTileClickEvent, {
                      agreementStatus: agreementStatusAnalyticsValue,
                      audience,
                      feature: 'avatarItemLicensing',
                      featureFlagEnabled: true,
                      itemPosition,
                      itemType: presentation.isBundle ? 'bundle' : 'asset',
                      targetType: 'avatarItem',
                    })
            }
            className='padding-small radius-small transition-colors hover:bg-shift-100 focus-visible:outline-focus'
          />
        </RevenueTargetTileImpression>
      );
    });
  }

  return (
    <div
      ref={gridRef}
      data-testid='collectible-revenue-target-grid'
      className='grid width-full gap-large items-start [grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr))] medium:[grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr))]'>
      {items}
    </div>
  );
};

export default CollectibleRevenueTargetGrid;
