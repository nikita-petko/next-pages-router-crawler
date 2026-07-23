/* istanbul ignore file */
import { useLocalization } from '@rbx/intl';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import ManagedPricingCard from '../../components/ManagedPricingCard';
import useProductCountSummary from '../hooks/useProductCountSummary';
import useGetManagedPricingSummary from '../../queries/useGetManagedPricingSummary';

/* Currently metrics and price test cards are all hardcoded, but will be replaced with actual data */
/* TODO: Design refinements on responsiveness, may switch to grid layout */
// TODO: Support skeleton loading state

const getManageItemsUrl = (universeId: number) =>
  dashboard.getManagedPricingUrl(universeId, 'manage-items');

function ProductCountCard({ universeId, className }: { universeId: number; className?: string }) {
  const locale = useLocalization().locale ?? undefined;

  const { totalEligibleCount, managedCount, isLoading, isError } =
    useProductCountSummary(universeId);

  const percentageFormatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // It is possible if we fallback to the summary counts that there are no counts in Frost, resulting in undefined data.
  // In this case, we want to show a placeholder message.
  const hasData = totalEligibleCount !== undefined && managedCount !== undefined;

  const optimizedRatio =
    hasData && totalEligibleCount !== 0 ? managedCount / totalEligibleCount : 0;
  const optimizedPercentageMessage = hasData
    ? `${percentageFormatter.format(optimizedRatio)} optimized`
    : '--';

  const managedCountMessage = hasData ? `${managedCount}/${totalEligibleCount} items` : '--';

  return (
    <ManagedPricingCard
      label='Managed pricing summary'
      content={managedCountMessage}
      hint={optimizedPercentageMessage}
      className={className}
      href={getManageItemsUrl(universeId)}
      loading={isLoading || isError}
    />
  );
}

function RevenueLiftCard({ universeId, className }: { universeId: number; className?: string }) {
  const locale = useLocalization().locale ?? undefined;
  const { data, isLoading, isError } = useGetManagedPricingSummary(universeId);

  const percentageFormatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  const revenueFormatter = new Intl.NumberFormat(locale, {});

  const summaryComplete = !isLoading && !isError;

  const revenueLiftRobux = data?.managedPricingImpact?.revenueLiftRobux;
  const revenueLiftPercentage = data?.managedPricingImpact?.revenueLiftPercentage;

  if (summaryComplete && (revenueLiftRobux === undefined || revenueLiftPercentage === undefined)) {
    return null;
  }

  return (
    <ManagedPricingCard
      label='Revenue lift'
      tooltip='Revenue lift tooltip'
      // Revenue lift will always be defined once the data finishes loading
      content={revenueFormatter.format(revenueLiftRobux!)}
      icon={{ name: 'icon-filled-robux' }}
      badge={{
        label: percentageFormatter.format(revenueLiftPercentage!),
        variant: 'Success',
        icon: 'icon-filled-arrow-small-up',
      }}
      hint='Last 12 months'
      className={className}
      loading={!summaryComplete}
    />
  );
}

function PayerConversionCard({
  universeId,
  className,
}: {
  universeId: number;
  className?: string;
}) {
  const locale = useLocalization().locale ?? undefined;
  const { data, isLoading, isError } = useGetManagedPricingSummary(universeId);

  const percentageFormatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  const summaryComplete = !isLoading && !isError;

  const impact = data?.managedPricingImpact;
  const regionalizedPayerRate = impact?.regionalizedPayerRate;
  const regionalizedPayerRateLift = impact?.regionalizedPayerRateLift;

  if (
    summaryComplete &&
    (regionalizedPayerRate === undefined || regionalizedPayerRateLift === undefined)
  ) {
    return null;
  }

  return (
    <ManagedPricingCard
      label='Payer conversion'
      tooltip='Payer conversion tooltip'
      content={percentageFormatter.format(regionalizedPayerRate!)}
      badge={{
        label: percentageFormatter.format(regionalizedPayerRateLift!),
        variant: 'Success',
        icon: 'icon-filled-arrow-small-up',
      }}
      hint='With managed pricing'
      className={className}
      loading={!summaryComplete}
    />
  );
}

function OngoingPriceTestCard({
  universeId,
  className,
}: {
  universeId: number;
  className?: string;
}) {
  const { isLoading, isError } = useGetManagedPricingSummary(universeId);

  return (
    <ManagedPricingCard
      label='Ongoing price test'
      content='150 items'
      badge={{
        label: 'In progress',
        variant: 'Neutral',
      }}
      hint='21 days remaining'
      className={className}
      href='#'
      loading={isLoading || isError}
    />
  );
}

function PreviousPriceTestCard({
  universeId,
  className,
}: {
  universeId: number;
  className?: string;
}) {
  const { isLoading, isError } = useGetManagedPricingSummary(universeId);

  return (
    <ManagedPricingCard
      label='Previous price test'
      content='175 items'
      badge={{
        label: 'Completed',
        variant: 'Success',
      }}
      hint='Ended September 15'
      className={className}
      href='#'
      loading={isLoading || isError}
    />
  );
}

function OverviewSummaryContainer({ universeId }: { universeId: number }) {
  return (
    // Using flex approach we need to set a max-width on the container
    <div className='flex wrap gap-large max-width-[1200px]'>
      <RevenueLiftCard universeId={universeId} className='grow-1 basis-[225px]' />
      <PayerConversionCard universeId={universeId} className='grow-1 basis-[225px]' />
      <OngoingPriceTestCard universeId={universeId} className='grow-1 basis-[225px]' />
      <PreviousPriceTestCard universeId={universeId} className='grow-1 basis-[225px]' />
      <ProductCountCard universeId={universeId} className='grow-1 basis-[225px]' />
    </div>
  );
}

export default OverviewSummaryContainer;
