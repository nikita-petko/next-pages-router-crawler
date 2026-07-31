import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import { RevenueTargetType } from '@rbx/client-content-licensing-api/v1';
import { FeedbackBanner, ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { useGetRevenueTargetsByAgreement } from '../hooks/useGetRevenueTargetsByAgreement';
import RevenueTargetGrid from './RevenueTargetGrid';

interface AgreementRevenueTargetsSectionProps {
  agreementId?: string;
  universeId?: number;
}

/**
 * Fetches and displays collaboration revenue targets on either agreement details surface.
 */
const AgreementRevenueTargetsSection: FunctionComponent<AgreementRevenueTargetsSectionProps> = ({
  agreementId,
  universeId,
}) => {
  const { translate } = useTranslation();
  const revenueTargetsQuery = useGetRevenueTargetsByAgreement({
    agreementId,
  });
  const { developerProducts, gamePasses } = useMemo(() => {
    const revenueTargets = revenueTargetsQuery.data ?? [];
    return {
      developerProducts: revenueTargets.filter(
        ({ revenueTargetType }) => revenueTargetType === RevenueTargetType.DeveloperProduct,
      ),
      gamePasses: revenueTargets.filter(
        ({ revenueTargetType }) => revenueTargetType === RevenueTargetType.GamePass,
      ),
    };
  }, [revenueTargetsQuery.data]);

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
    return <FeedbackBanner severity='Error' title={translate('Error.LoadingData')} />;
  }

  return (
    <>
      {developerProducts.length > 0 && (
        <section className='flex flex-col gap-medium'>
          <Typography variant='h6'>{translate('Label.DeveloperProducts')}</Typography>
          <RevenueTargetGrid revenueTargets={developerProducts} universeId={universeId} />
        </section>
      )}

      {gamePasses.length > 0 && (
        <section className='flex flex-col gap-medium'>
          <Typography variant='h6'>{translate('Label.GamePasses')}</Typography>
          <RevenueTargetGrid revenueTargets={gamePasses} universeId={universeId} />
        </section>
      )}
    </>
  );
};

export default AgreementRevenueTargetsSection;
