import React from 'react';
import { clsx as cx } from '@rbx/foundation-ui';
import { Flex } from '@modules/miscellaneous/common/components';
import Section from './Section';
import layoutStyles from './Layout.module.css';
import styles from './Metrics.module.css';

type Metrics = {
  name: string;
  value: string;
  unit: string;
};

const allMetrics: Metrics[] = [
  {
    name: 'Daily active users',
    value: '144',
    unit: 'M',
  },
  {
    name: 'Paid to Creators in 2025',
    value: '$1.5',
    unit: 'B',
  },
  {
    name: 'Avg Earned Per Top 100 Creator',
    value: '$7',
    unit: 'M',
  },
];

export default function Metrics() {
  return (
    <Section title='Launch at global scale' spacingClassName={layoutStyles.metricsSpacing}>
      <div className={cx(styles.metricsContainer, 'small:gap-small', 'medium:gap-xxlarge')}>
        {allMetrics.map(({ name, value, unit }) => (
          <Flex
            key={name}
            className={cx(
              layoutStyles.card,
              'padding-x-medium',
              'padding-y-xlarge',
              'medium:padding-x-large',
              'medium:padding-y-xlarge',
              'large:padding-x-xxlarge',
              'large:padding-y-xxlarge',
              'bg-shift-100',
              'gap-medium',
            )}
            flexDirection='column'
            alignItems='flex-start'
            justifyContent='space-between'>
            <span className='text-title-small medium:text-title-medium large:text-title-large content-muted'>
              {name}
            </span>
            <div>
              <span className={cx(styles.metricsValue, 'text-display-small', 'content-emphasis')}>
                {value}
              </span>
              <span className={cx(styles.metricsUnit, 'text-display-small', 'content-emphasis')}>
                {unit}
              </span>
            </div>
          </Flex>
        ))}
      </div>
    </Section>
  );
}
