import { NumberFormatter } from '@rbx/core';
import { Locale, useLocalization, useTranslation, type UseTranslationResult } from '@rbx/intl';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { pluralize } from '@modules/monetization-shared/pluralize';
import EventStatusBadge from '../../common/EventStatusBadge';
import ManagedPricingCard from '../../common/ManagedPricingCard';
import { useGetManagedPricingSummary } from '../../queries/useGetManagedPricingSummary';
import { useProductCountSummary } from '../hooks/useProductCountSummary';

const getManageItemsUrl = (universeId: number) =>
  dashboard.getManagedPricingUrl(universeId, 'manage-items');

function isNonNegative(value: number | null | undefined): value is number {
  return value !== undefined && value !== null && value >= 0;
}

const MAX_DISPLAYED_COUNT = 999;
const displayTotalCount = (count: number) =>
  count > MAX_DISPLAYED_COUNT ? `${MAX_DISPLAYED_COUNT}+` : count.toString();

const COMPACT_REVENUE_THRESHOLD = 1_000_000;
const COMPACT_REVENUE_DECIMAL_PLACES = 2;

function formatRevenueRobux(
  value: number | null | undefined,
  revenueFormatter: NumberFormatter,
  compactRevenueOptions: Intl.NumberFormatOptions,
) {
  if (value == null) {
    return '--';
  }

  if (value < COMPACT_REVENUE_THRESHOLD) {
    return revenueFormatter.getCustomNumber(value, {}).toString();
  }

  return revenueFormatter.getCustomNumber(value, compactRevenueOptions).toString();
}

type CardProps = {
  universeId: number;
  className?: string;
  loading?: boolean;
};

function ProductCountCard({ universeId, className, loading }: CardProps) {
  const locale = useLocalization().locale ?? undefined;
  const { translate } = useTranslation();

  const {
    totalEligibleCount,
    managedCount,
    isLoading: isProductCountLoading,
    isError: isProductCountError,
  } = useProductCountSummary(universeId);

  const percentageFormatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // It is possible if we fallback to the summary counts that there are no counts in Frost, resulting in undefined data.
  // In this case, we want to show a placeholder message.
  const hasData =
    !isProductCountError && totalEligibleCount !== undefined && managedCount !== undefined;

  const optimizedRatio =
    hasData && totalEligibleCount !== 0 ? managedCount / totalEligibleCount : 0;
  const optimizedPercentageMessage = hasData
    ? translate('Hint.PercentOptimized', {
        percentage: percentageFormatter.format(optimizedRatio),
      })
    : '--';

  const managedCountMessage = hasData
    ? translate('Label.ManagedItemCount', {
        managedCount: displayTotalCount(managedCount),
        totalCount: displayTotalCount(totalEligibleCount),
      })
    : '--';

  return (
    <ManagedPricingCard
      label={translate('Label.ManagedPricingSummary')}
      content={managedCountMessage}
      hint={optimizedPercentageMessage}
      className={className}
      href={getManageItemsUrl(universeId)}
      loading={!!loading || isProductCountLoading}
    />
  );
}

function TotalRevenueCard({ universeId, className, loading }: CardProps) {
  const locale = useLocalization().locale ?? undefined;
  const { translate } = useTranslation();
  const { data } = useGetManagedPricingSummary(universeId);

  const percentageFormatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const revenueFormatter = new NumberFormatter(locale ?? Locale.English, '');
  const compactRevenueOptions: Intl.NumberFormatOptions = {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: COMPACT_REVENUE_DECIMAL_PLACES,
    maximumFractionDigits: COMPACT_REVENUE_DECIMAL_PLACES,
    roundingMode: 'trunc',
  };

  // NOTE: this is not revenue lift in robux, but the total revenue for past 12 months.
  // The badge will represent the percentage lift of the total revenue from MP.
  const revenueLiftRobux = data?.managedPricingImpact?.revenueLiftRobux;
  const revenueLiftPercentage = data?.managedPricingImpact?.revenueLiftPercentage;

  /* istanbul ignore next - defensive guard */
  if (!loading && (revenueLiftRobux == null || revenueLiftPercentage == null)) {
    return null;
  }

  // Only show percentage badge if > 0
  const percentageBadgeLabel = revenueLiftPercentage
    ? percentageFormatter.format(revenueLiftPercentage / 100)
    : null;
  const showPercentageBadge =
    percentageBadgeLabel !== null && percentageBadgeLabel !== percentageFormatter.format(0);

  return (
    <ManagedPricingCard
      label={translate('Label.TotalRevenueCard')}
      tooltip={translate('Description.TotalRevenueCard')}
      content={formatRevenueRobux(revenueLiftRobux, revenueFormatter, compactRevenueOptions)}
      icon={{ name: 'icon-filled-robux' }}
      badgeProps={
        showPercentageBadge
          ? {
              // NOTE: The summary endpoint returns a percentage value; Intl percent expects a ratio.
              label: percentageBadgeLabel,
              variant: 'Success' as const,
              icon: 'icon-filled-arrow-small-up' as const,
            }
          : undefined
      }
      hint={translate('Hint.Last12Months')}
      className={className}
      loading={loading}
    />
  );
}

function PayerConversionCard({ universeId, className, loading }: CardProps) {
  const locale = useLocalization().locale ?? undefined;
  const { translate } = useTranslation();
  const { data } = useGetManagedPricingSummary(universeId);

  const percentageFormatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  const impact = data?.managedPricingImpact;
  const regionalizedPayerRate = impact?.regionalizedPayerRate;
  const regionalizedPayerRateLift = impact?.regionalizedPayerRateLift;

  /* istanbul ignore next - defensive guard */
  if (
    !loading &&
    (regionalizedPayerRate === undefined || regionalizedPayerRateLift === undefined)
  ) {
    return null;
  }

  return (
    <ManagedPricingCard
      label={translate('Label.PayerConversion')}
      tooltip={translate('Description.PayerConversion')}
      content={regionalizedPayerRate ? percentageFormatter.format(regionalizedPayerRate) : '--'}
      badgeProps={{
        label: regionalizedPayerRateLift
          ? percentageFormatter.format(regionalizedPayerRateLift)
          : '--',
        variant: regionalizedPayerRateLift && regionalizedPayerRateLift > 0 ? 'Success' : 'Neutral',
        icon: 'icon-filled-arrow-small-up',
      }}
      hint={translate('Hint.WithManagedPricing')}
      className={className}
      loading={loading}
    />
  );
}

function formatItemCount(
  count: number,
  clamp: boolean,
  translate: UseTranslationResult['translate'],
) {
  const displayCount = clamp ? displayTotalCount(count) : count.toString();
  return pluralize(
    count,
    translate('Label.ItemCountSingle', { count: displayCount }),
    translate('Label.ItemCountPlural', { count: displayCount }),
  );
}

function formatDaysRemaining(
  endTime: Date | null,
  startTime: Date,
  translate: UseTranslationResult['translate'],
): string {
  /* istanbul ignore next - defensive guard, only called for non-Upcoming events which have endTime */
  if (endTime == null) {
    return translate('Hint.StartsOnDate', {
      date: startTime.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }),
    });
  }
  const msRemaining = endTime.getTime() - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
  if (daysRemaining === 0) {
    return translate('Hint.EndingToday');
  }
  if (daysRemaining === 1) {
    return translate('Hint.OneDayRemaining');
  }
  return translate('Hint.DaysRemaining', { count: daysRemaining.toString() });
}

function formatDaysUntilStart(
  startTime: Date,
  translate: UseTranslationResult['translate'],
): string {
  const msUntilStart = startTime.getTime() - Date.now();
  const daysUntilStart = Math.max(0, Math.floor(msUntilStart / (24 * 60 * 60 * 1000)));
  if (daysUntilStart === 0) {
    return translate('Hint.StartingToday');
  }
  if (daysUntilStart === 1) {
    return translate('Hint.StartsInOneDay');
  }
  return translate('Hint.StartsInDays', { count: daysUntilStart.toString() });
}

function formatEndedDate(endTime: Date, locale?: Locale | null): string {
  return endTime.toLocaleDateString(locale ?? undefined, { month: 'long', day: 'numeric' });
}

function CurrentPriceTestCard({ universeId, className, loading }: CardProps) {
  const { translate } = useTranslation();
  const { data } = useGetManagedPricingSummary(universeId);
  const currentEvent = data?.experimentOverview?.currentEvent ?? null;

  const {
    managedCount,
    isLoading: isProductCountLoading,
    isError: isProductCountError,
  } = useProductCountSummary(universeId);

  /* istanbul ignore next - defensive guard */
  if (!loading && !currentEvent) {
    return null;
  }

  const isUpcoming = currentEvent?.status === 'Upcoming';

  if (isUpcoming && isProductCountError) {
    return null;
  }

  const needsManagedCountLoading = isUpcoming && isProductCountLoading;
  const totalProductCount = isUpcoming
    ? managedCount
    : (currentEvent?.totalProductCount ?? managedCount);

  const itemsContent =
    totalProductCount != null ? formatItemCount(totalProductCount, isUpcoming, translate) : '--';

  let hint: string | undefined;
  if (currentEvent) {
    hint = isUpcoming
      ? formatDaysUntilStart(currentEvent.startTime, translate)
      : formatDaysRemaining(currentEvent.endTime, currentEvent.startTime, translate);
  }

  return (
    <ManagedPricingCard
      label={translate(isUpcoming ? 'Label.UpcomingPriceTest' : 'Label.OngoingPriceTest')}
      content={itemsContent}
      badge={<EventStatusBadge status={currentEvent?.status ?? 'Active'} />}
      hint={hint}
      className={className}
      href={
        currentEvent ? dashboard.getManagedPricingEventDetailsUrl(universeId, currentEvent.id) : '#'
      }
      loading={!!loading || needsManagedCountLoading}
    />
  );
}

function PreviousPriceTestCard({ universeId, className, loading }: CardProps) {
  const locale = useLocalization().locale;
  const { translate } = useTranslation();
  const { data } = useGetManagedPricingSummary(universeId);
  const previousEvent = data?.experimentOverview?.previousEvent ?? null;

  /* istanbul ignore next - defensive guard */
  if (!loading && !previousEvent) {
    return null;
  }

  const totalProductCount = previousEvent?.totalProductCount;
  const itemsContent =
    totalProductCount != null ? formatItemCount(totalProductCount, false, translate) : '--';

  return (
    <ManagedPricingCard
      label={translate('Label.PreviousPriceTest')}
      content={itemsContent}
      badge={<EventStatusBadge status={previousEvent?.status ?? 'Completed'} />}
      hint={
        previousEvent
          ? translate('Hint.EndedOnDate', {
              date: formatEndedDate(previousEvent.endTime, locale),
            })
          : undefined
      }
      className={className}
      href={
        previousEvent
          ? dashboard.getManagedPricingEventDetailsUrl(universeId, previousEvent.id)
          : '#'
      }
      loading={loading}
    />
  );
}

const CARD_MIN_WIDTH = 250;
const CARD_GAP = 16;
const PRETTY_WIDTH_INCREMENT = 25;

// Round up to the nearest PRETTY_WIDTH_INCREMENT so the container caps at a clean pixel value
// (e.g. 5 cards = 250*5 + 16*4 = 1384 -> 1400).
function getPrettyMaxWidth(numCards: number) {
  const raw = numCards * CARD_MIN_WIDTH + Math.max(numCards - 1, 0) * CARD_GAP;
  return Math.ceil(raw / PRETTY_WIDTH_INCREMENT) * PRETTY_WIDTH_INCREMENT;
}

function OverviewSummaryContainer({ universeId }: { universeId: number }) {
  const { data, isLoading } = useGetManagedPricingSummary(universeId);

  const impact = data?.managedPricingImpact;
  const experiments = data?.experimentOverview;

  const showTotalRevenue =
    isLoading ||
    (isNonNegative(impact?.revenueLiftRobux) && isNonNegative(impact?.revenueLiftPercentage));
  const showPayerConversion =
    isLoading ||
    (isNonNegative(impact?.regionalizedPayerRate) &&
      isNonNegative(impact?.regionalizedPayerRateLift));
  const showCurrentPriceTest = isLoading || !!experiments?.currentEvent;
  const showPreviousPriceTest = isLoading || !!experiments?.previousEvent;

  // ProductCountCard always renders (count is resolved either from the summary endpoint
  // or a local fallback), so it always contributes to the card total.
  const numCards =
    1 +
    (showTotalRevenue ? 1 : 0) +
    (showPayerConversion ? 1 : 0) +
    (showCurrentPriceTest ? 1 : 0) +
    (showPreviousPriceTest ? 1 : 0);

  const maxWidth = getPrettyMaxWidth(numCards);

  // Note: intentionally overriding via CSS variables to maintain single source of truth for card width
  const style = {
    '--card-min-width': `${CARD_MIN_WIDTH}px`,
    maxWidth: `${maxWidth}px`,
  } as React.CSSProperties;

  return (
    <div
      className='grid gap-large [grid-template-columns:repeat(auto-fit,minmax(var(--card-min-width),1fr))]'
      style={style}>
      {showTotalRevenue && <TotalRevenueCard universeId={universeId} loading={isLoading} />}
      {showPayerConversion && <PayerConversionCard universeId={universeId} loading={isLoading} />}
      {showCurrentPriceTest && <CurrentPriceTestCard universeId={universeId} loading={isLoading} />}
      {showPreviousPriceTest && (
        <PreviousPriceTestCard universeId={universeId} loading={isLoading} />
      )}
      <ProductCountCard universeId={universeId} loading={isLoading} />
    </div>
  );
}

export default OverviewSummaryContainer;
