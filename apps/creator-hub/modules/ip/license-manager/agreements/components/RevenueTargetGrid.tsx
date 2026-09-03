import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import type { RevenueTargetResponse } from '@rbx/client-content-licensing-api/v1';
import { Alert, ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useVisibleImpression } from '@modules/licenses/hooks/useVisibleImpression';
import { LicenseManagerImpressionEvent, useLicenseManagerLoggerLogOnce } from '../../utils/logger';
import useResolveRevenueTargets from '../hooks/useResolveRevenueTargets';
import {
  getAgreementStatusAnalyticsValue,
  REVENUE_TARGET_GRID_IMPRESSION_VISIBILITY_THRESHOLD,
  type AgreementRevenueTargetAnalyticsContext,
  type AgreementRevenueTargetType,
} from './revenueTargetAnalytics';
import RevenueTargetCard, { isDisplayableRevenueTarget } from './RevenueTargetCard';
import RevenueTargetTileImpression from './RevenueTargetTileImpression';

interface RevenueTargetGridProps {
  analyticsContext: AgreementRevenueTargetAnalyticsContext;
  revenueTargets: RevenueTargetResponse[];
  targetType: Extract<AgreementRevenueTargetType, 'developerProduct' | 'gamePass'>;
  universeId?: number;
}

/**
 * Displays supported revenue targets in a responsive grid. Each agreement details section can
 * pass its filtered Developer Product or Game Pass targets directly from
 * listRevenueTargetsByAgreement.
 */
const RevenueTargetGrid: FunctionComponent<RevenueTargetGridProps> = ({
  analyticsContext,
  revenueTargets,
  targetType,
  universeId,
}) => {
  const { translate } = useTranslation();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const { agreementStatus, audience } = analyticsContext;
  const agreementStatusAnalyticsValue = getAgreementStatusAnalyticsValue(agreementStatus);
  const displayableRevenueTargets = useMemo(
    () => revenueTargets.filter(isDisplayableRevenueTarget),
    [revenueTargets],
  );
  const resolvedRevenueTargetsQuery = useResolveRevenueTargets({
    universeId,
    revenueTargets: displayableRevenueTargets,
  });
  const resolvedRevenueTargets = useMemo(
    () => resolvedRevenueTargetsQuery.data ?? [],
    [resolvedRevenueTargetsQuery.data],
  );
  const impressionDedupeKey = `${audience}:${agreementStatusAnalyticsValue}:${targetType}:${displayableRevenueTargets
    .map(({ revenueTargetId }) => revenueTargetId)
    .join('|')}`;
  const logGridImpression = useCallback(() => {
    logOnce(
      LicenseManagerImpressionEvent.AgreementRevenueTargetGridImpressionEvent,
      {
        agreementStatus: agreementStatusAnalyticsValue,
        audience,
        displayedTargetCount: resolvedRevenueTargets.length,
        feature: 'inGameSalesLicensing',
        featureFlagEnabled: true,
        returnedTargetCount: displayableRevenueTargets.length,
        targetType,
      },
      impressionDedupeKey,
    );
  }, [
    agreementStatusAnalyticsValue,
    audience,
    displayableRevenueTargets.length,
    impressionDedupeKey,
    logOnce,
    resolvedRevenueTargets,
    targetType,
  ]);
  const gridRef = useVisibleImpression<HTMLDivElement>(
    logGridImpression,
    resolvedRevenueTargetsQuery.isSuccess,
    REVENUE_TARGET_GRID_IMPRESSION_VISIBILITY_THRESHOLD,
  );

  useEffect(() => {
    const hasPartialResolutionFailure =
      resolvedRevenueTargetsQuery.isSuccess &&
      resolvedRevenueTargets.length < displayableRevenueTargets.length;
    if (!resolvedRevenueTargetsQuery.isError && !hasPartialResolutionFailure) {
      return;
    }

    logOnce(
      LicenseManagerImpressionEvent.AgreementRevenueTargetResolutionFailureImpressionEvent,
      {
        agreementStatus: agreementStatusAnalyticsValue,
        audience,
        displayedTargetCount: resolvedRevenueTargets.length,
        feature: 'inGameSalesLicensing',
        featureFlagEnabled: true,
        resolutionStage: 'revenueTargetDetails',
        returnedTargetCount: displayableRevenueTargets.length,
        targetType,
      },
      impressionDedupeKey,
    );
  }, [
    agreementStatusAnalyticsValue,
    audience,
    displayableRevenueTargets.length,
    impressionDedupeKey,
    logOnce,
    resolvedRevenueTargets.length,
    resolvedRevenueTargetsQuery.isError,
    resolvedRevenueTargetsQuery.isSuccess,
    targetType,
  ]);

  if (
    displayableRevenueTargets.length === 0 ||
    universeId === undefined ||
    !Number.isFinite(universeId) ||
    universeId <= 0
  ) {
    return null;
  }

  if (resolvedRevenueTargetsQuery.isPending) {
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

  if (resolvedRevenueTargetsQuery.isError) {
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

  return (
    <div
      ref={gridRef}
      className='grid gap-small [grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr))]'>
      {resolvedRevenueTargets.map((revenueTarget, itemPosition) => (
        <RevenueTargetTileImpression
          key={`${revenueTarget.type}:${revenueTarget.id}`}
          analyticsContext={analyticsContext}
          dedupeKey={`${impressionDedupeKey}:${revenueTarget.type}:${revenueTarget.id}`}
          feature='inGameSalesLicensing'
          itemPosition={itemPosition}
          targetType={targetType}>
          <RevenueTargetCard revenueTarget={revenueTarget} />
        </RevenueTargetTileImpression>
      ))}
    </div>
  );
};

export default RevenueTargetGrid;
