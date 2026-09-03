import { useCallback, type FunctionComponent, type ReactNode } from 'react';
import { useVisibleImpression } from '@modules/licenses/hooks/useVisibleImpression';
import { LicenseManagerImpressionEvent, useLicenseManagerLoggerLogOnce } from '../../utils/logger';
import {
  getAgreementStatusAnalyticsValue,
  type AgreementRevenueTargetAnalyticsContext,
  type AgreementRevenueTargetsFeature,
  type AgreementRevenueTargetType,
} from './revenueTargetAnalytics';

interface RevenueTargetTileImpressionProps {
  analyticsContext: AgreementRevenueTargetAnalyticsContext;
  children: ReactNode;
  dedupeKey: string;
  feature: AgreementRevenueTargetsFeature;
  itemPosition: number;
  itemType?: 'asset' | 'bundle';
  targetType: AgreementRevenueTargetType;
}

const RevenueTargetTileImpression: FunctionComponent<RevenueTargetTileImpressionProps> = ({
  analyticsContext,
  children,
  dedupeKey,
  feature,
  itemPosition,
  itemType,
  targetType,
}) => {
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const { agreementStatus, audience } = analyticsContext;
  const logImpression = useCallback(() => {
    logOnce(
      LicenseManagerImpressionEvent.AgreementRevenueTargetTileImpressionEvent,
      {
        agreementStatus: getAgreementStatusAnalyticsValue(agreementStatus),
        audience,
        feature,
        featureFlagEnabled: true,
        itemPosition,
        ...(itemType == null ? {} : { itemType }),
        targetType,
      },
      dedupeKey,
    );
  }, [agreementStatus, audience, dedupeKey, feature, itemPosition, itemType, logOnce, targetType]);
  const tileRef = useVisibleImpression<HTMLDivElement>(logImpression);

  return (
    <div ref={tileRef} className='width-full min-width-0'>
      {children}
    </div>
  );
};

export default RevenueTargetTileImpression;
