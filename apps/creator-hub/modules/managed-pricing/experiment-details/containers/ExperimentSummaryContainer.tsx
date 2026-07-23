/* istanbul ignore file */
import React, { useMemo } from 'react';
import { Locale, useLocalization } from '@rbx/intl';
import { pluralize } from '@modules/monetization-shared/pluralize';
import ManagedPricingCard from '../../components/ManagedPricingCard';
import type { ManagedPricingEvent } from '../../pricing-activity/types';
import { useExperimentProductDetails } from '../hooks/useMockExperimentProductDetails';
import type { ExperimentProduct } from '../types';
import styles from './ExperimentSummaryContainer.module.css';

type Props = ManagedPricingEvent & {
  universeId: number;
};

function formatPermilleToPercent(permille: number, locale?: Locale | null) {
  const decimalValue = permille / 1000;
  const formatter = new Intl.NumberFormat(locale ?? undefined, {
    style: 'percent',
    signDisplay: 'never',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return formatter.format(decimalValue);
}

function formatItemCount(count: number): string {
  return pluralize(count, `${count} item`, `${count} items`);
}

function useProductStats(products: ExperimentProduct[]) {
  return useMemo(() => {
    let priceIncrease = 0;
    let priceDecrease = 0;
    let noChange = 0;

    // eslint-disable-next-line no-restricted-syntax -- for-of is better
    for (const p of products) {
      const pct = p.optimizationPercentage ?? 0;
      if (pct > 0) priceIncrease += 1;
      else if (pct < 0) priceDecrease += 1;
      else noChange += 1;
    }

    return { priceIncrease, priceDecrease, noChange, total: products.length };
  }, [products]);
}

function ExperimentSummaryContainer({ universeId, status, revenueImpactPermille }: Props) {
  const locale = useLocalization().locale ?? undefined;
  const { products } = useExperimentProductDetails({ universeId, status });
  const stats = useProductStats(products);

  if (status === 'upcoming') {
    const upcomingStatCards = [
      { label: 'Products to be tested', content: formatItemCount(stats.total) },
      { label: 'Test population', content: '34%' }, // Don't think this exists for upcoming?
    ] as const satisfies React.ComponentProps<typeof ManagedPricingCard>[];

    return (
      // Will likely need to revisit this for in-progress
      <div className='flex flex-col gap-large medium:flex-row medium:max-width-[400px]'>
        {upcomingStatCards.map((card) => (
          <ManagedPricingCard
            key={card.label}
            label={card.label}
            content={card.content}
            className='grow-1 text-no-wrap min-width-[180px]'
          />
        ))}
      </div>
    );
  }

  const completedCards = [
    { label: 'Price increase', content: formatItemCount(stats.priceIncrease) },
    { label: 'Price decrease', content: formatItemCount(stats.priceDecrease) },
    { label: 'No change in price', content: formatItemCount(stats.noChange) },
    {
      label: 'Revenue impact',
      content: formatPermilleToPercent(revenueImpactPermille ?? 0, locale),
    },
    { label: 'Products tested', content: formatItemCount(stats.total) },
    { label: 'Test population', content: '34%' },
  ] as const satisfies React.ComponentProps<typeof ManagedPricingCard>[];

  return (
    <div className={styles.fullSummaryGrid}>
      {completedCards.map((card) => (
        <ManagedPricingCard
          key={card.label}
          label={card.label}
          content={card.content}
          className='text-no-wrap'
        />
      ))}
    </div>
  );
}

export default ExperimentSummaryContainer;
