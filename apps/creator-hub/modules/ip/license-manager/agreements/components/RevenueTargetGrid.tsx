import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import type { RevenueTargetResponse } from '@rbx/client-content-licensing-api/v1';
import { FeedbackBanner, ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useResolveRevenueTargets from '../hooks/useResolveRevenueTargets';
import RevenueTargetCard, { isDisplayableRevenueTarget } from './RevenueTargetCard';

interface RevenueTargetGridProps {
  revenueTargets: RevenueTargetResponse[];
  universeId?: number;
}

/**
 * Displays supported revenue targets in a responsive grid. Each agreement details section can
 * pass its filtered Developer Product or Game Pass targets directly from
 * listRevenueTargetsByAgreement.
 */
const RevenueTargetGrid: FunctionComponent<RevenueTargetGridProps> = ({
  revenueTargets,
  universeId,
}) => {
  const { translate } = useTranslation();
  const displayableRevenueTargets = useMemo(
    () => revenueTargets.filter(isDisplayableRevenueTarget),
    [revenueTargets],
  );
  const resolvedRevenueTargetsQuery = useResolveRevenueTargets({
    universeId,
    revenueTargets: displayableRevenueTargets,
  });

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
      <FeedbackBanner
        className='width-fit max-width-full'
        severity='Error'
        title={translate('Error.LoadingData')}
      />
    );
  }

  return (
    <div className='grid gap-small [grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr))]'>
      {(resolvedRevenueTargetsQuery.data ?? []).map((revenueTarget) => (
        <RevenueTargetCard
          key={`${revenueTarget.type}:${revenueTarget.id}`}
          revenueTarget={revenueTarget}
        />
      ))}
    </div>
  );
};

export default RevenueTargetGrid;
