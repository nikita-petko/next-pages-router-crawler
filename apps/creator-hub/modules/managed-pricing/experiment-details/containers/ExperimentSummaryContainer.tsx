import type { Locale } from '@rbx/intl';
import { useLocalization, useTranslation, type UseTranslationResult } from '@rbx/intl';
import { pluralize } from '@modules/monetization-shared/pluralize';
import ManagedPricingCard from '../../common/ManagedPricingCard';
import { useGetExperimentSummary } from '../../queries/useGetExperimentSummary';
import type { ManagedPricingEvent } from '../../types';
import { useUpcomingExperimentProducts } from '../hooks/useUpcomingExperimentProducts';
import styles from './ExperimentSummaryContainer.module.css';

type Props = Omit<ManagedPricingEvent, 'eventReferenceId'> & {
  universeId: number;
  experimentId: string;
};

const EMPTY_VALUE_PLACEHOLDER = '—';

// Mirrors `MAX_DISPLAYED_COUNT` in monetization-shared/table-v1/TableControls so the
// summary cards clamp to "999+" the same way the tables on this page do.
const MAX_DISPLAYED_COUNT = 999;

function formatMicrosToPercent(micros: number, locale?: Locale | null) {
  // 1. Convert micros to a base decimal (e.g., 101000 -> 0.101)
  const decimalValue = micros / 1_000_000;

  // 2. Set up the formatter
  const formatter = new Intl.NumberFormat(locale ?? undefined, {
    style: 'percent',
    signDisplay: 'never', // Never show the sign
    minimumFractionDigits: 1, // Ensures at least 1 decimal place (e.g., 10.1%)
    maximumFractionDigits: 1, // Prevents it from going beyond 1 decimal place
  });

  // 3. Format and return
  return formatter.format(decimalValue);
}

function formatItemCount(count: number, translate: UseTranslationResult['translate']) {
  if (count > MAX_DISPLAYED_COUNT) {
    return translate('Label.ItemCountPlural' /* TranslationNamespace.ManagedPricing */, {
      count: `${MAX_DISPLAYED_COUNT}+`,
    });
  }
  return pluralize(
    count,
    translate('Label.ItemCountSingle' /* TranslationNamespace.ManagedPricing */, {
      count: count.toString(),
    }),
    translate('Label.ItemCountPlural' /* TranslationNamespace.ManagedPricing */, {
      count: count.toString(),
    }),
  );
}

/**
 * Renders the single product-count card for `Upcoming` events. The PEA summary
 * does not yet carry a breakdown for upcoming experiments and PCA does not
 * populate `totalProductCount` either, so the count is sourced from the same
 * managed-products list that backs `UpcomingProductDetailsTableContainer` —
 * keeping the summary in sync with the table rendered below it.
 */
function UpcomingProductCountCard({ universeId }: { universeId: number }) {
  const { translate } = useTranslation();
  const { products, isAllProductsLoaded } = useUpcomingExperimentProducts({ universeId });

  return (
    <ManagedPricingCard
      label={translate('Label.ProductsToBeTested' /* TranslationNamespace.ManagedPricing */)}
      content={formatItemCount(products.length, translate)}
      loading={!isAllProductsLoaded}
      className='grow-1 text-no-wrap min-width-[180px]'
    />
  );
}

function ExperimentSummaryContainer({
  universeId,
  status,
  totalProductCount,
  experimentId,
}: Props) {
  const locale = useLocalization().locale ?? undefined;
  const { translate } = useTranslation();

  // Upcoming events do not have an experiment entity yet, so skip the PEA fetch
  // entirely for that state — the Upcoming card sources its count from the
  // managed-products list instead.
  const { data: summary, isLoading: isLoadingSummary } = useGetExperimentSummary(
    { universeId, experimentId },
    { enabled: status !== 'Upcoming' },
  );

  // Total product count is sourced from the PCA event when available (it carries
  // the planned/active set); fall back to summing the PEA breakdown for completed
  // experiments where PCA may not have populated it.
  const breakdown = summary?.priceChangeBreakdown ?? null;
  const breakdownTotal = breakdown
    ? breakdown.increased + breakdown.decreased + breakdown.noChange
    : 0;
  const productCount = totalProductCount ?? breakdownTotal;

  const formatCount = (count: number) => formatItemCount(count, translate);

  const testPopulation =
    summary?.experimentPopulationInMicroUnits != null
      ? formatMicrosToPercent(summary.experimentPopulationInMicroUnits, locale)
      : EMPTY_VALUE_PLACEHOLDER;

  if (status === 'Upcoming') {
    return (
      <div className='flex flex-col gap-large medium:flex-row medium:max-width-[200px]'>
        <UpcomingProductCountCard universeId={universeId} />
      </div>
    );
  }

  if (status === 'Cancelled' || status === 'Failed') {
    // Cancelled/Failed events may never populate totalProductCount on the PCA side
    // (e.g. cancelled before any product ran). Distinguish unknown (null) from
    // legitimately zero so the card surfaces the same '—' placeholder we use for
    // testPopulation rather than misreporting "0 items".
    const statCards = [
      {
        label: translate('Label.ProductsTested' /* TranslationNamespace.ManagedPricing */),
        content:
          totalProductCount != null ? formatCount(totalProductCount) : EMPTY_VALUE_PLACEHOLDER,
      },
    ] as const satisfies React.ComponentProps<typeof ManagedPricingCard>[];

    return (
      <div className='flex flex-col gap-large medium:flex-row medium:max-width-[200px]'>
        {statCards.map((card) => (
          <ManagedPricingCard
            key={card.label}
            label={card.label}
            content={card.content}
            loading={isLoadingSummary}
            className='grow-1 text-no-wrap min-width-[180px]'
          />
        ))}
      </div>
    );
  }

  if (status === 'Active') {
    const statCards = [
      {
        label: translate('Label.ProductsInTest' /* TranslationNamespace.ManagedPricing */),
        content: formatCount(productCount),
      },
      {
        label: translate('Label.TestPopulation' /* TranslationNamespace.ManagedPricing */),
        content: testPopulation,
      },
    ] as const satisfies React.ComponentProps<typeof ManagedPricingCard>[];

    return (
      <div className='flex flex-col gap-large medium:flex-row medium:max-width-[400px]'>
        {statCards.map((card) => (
          <ManagedPricingCard
            key={card.label}
            label={card.label}
            content={card.content}
            loading={isLoadingSummary}
            className='grow-1 text-no-wrap min-width-[180px]'
          />
        ))}
      </div>
    );
  }

  // Completed
  const revenueLiftMicros = summary?.revenueLiftInMicroUnits ?? 0;
  const statCards = [
    {
      label: translate('Label.PriceIncrease' /* TranslationNamespace.ManagedPricing */),
      content: formatCount(breakdown?.increased ?? 0),
    },
    {
      label: translate('Label.PriceDecrease' /* TranslationNamespace.ManagedPricing */),
      content: formatCount(breakdown?.decreased ?? 0),
    },
    {
      label: translate('Label.NoChangeInPrice' /* TranslationNamespace.ManagedPricing */),
      content: formatCount(breakdown?.noChange ?? 0),
    },
    {
      label: translate('Label.RevenueImpact' /* TranslationNamespace.ManagedPricing */),
      content: formatMicrosToPercent(revenueLiftMicros, locale),
    },
    {
      label: translate('Label.ProductsTested' /* TranslationNamespace.ManagedPricing */),
      content: formatCount(productCount),
    },
    {
      label: translate('Label.TestPopulation' /* TranslationNamespace.ManagedPricing */),
      content: testPopulation,
    },
  ] as const satisfies React.ComponentProps<typeof ManagedPricingCard>[];

  return (
    <div className={styles.fullSummaryGrid}>
      {statCards.map((card) => (
        <ManagedPricingCard
          key={card.label}
          label={card.label}
          content={card.content}
          loading={isLoadingSummary}
          className='text-no-wrap'
        />
      ))}
    </div>
  );
}

export default ExperimentSummaryContainer;
