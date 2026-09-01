import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import { RevenueTargetType } from '@rbx/client-content-licensing-api/v1';
import { FeedbackBanner, Link, ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { useGetRevenueTargetsByAgreement } from '../hooks/useGetRevenueTargetsByAgreement';
import RevenueTargetGrid from './RevenueTargetGrid';

interface AgreementRevenueTargetsSectionProps {
  agreementId?: string;
  showMonetizationLinks?: boolean;
  universeId?: number;
}

/**
 * Fetches and displays collaboration revenue targets on either agreement details surface.
 */
const AgreementRevenueTargetsSection: FunctionComponent<AgreementRevenueTargetsSectionProps> = ({
  agreementId,
  showMonetizationLinks = false,
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
      {developerProducts.length > 0 && (
        <section className='flex flex-col gap-medium'>
          {developerProductsHref ? (
            <Link
              href={developerProductsHref}
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
          <RevenueTargetGrid revenueTargets={developerProducts} universeId={universeId} />
        </section>
      )}

      {gamePasses.length > 0 && (
        <section className='flex flex-col gap-medium'>
          {gamePassesHref ? (
            <Link
              href={gamePassesHref}
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
          <RevenueTargetGrid revenueTargets={gamePasses} universeId={universeId} />
        </section>
      )}
    </>
  );
};

export default AgreementRevenueTargetsSection;
