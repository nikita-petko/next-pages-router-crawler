import { Card, Divider } from '@rbx/foundation-ui';
import type { JSX } from 'react';

import Skeleton from '@components/common/Skeleton';
import useSummaryCardStyles from '@components/reporting/SummaryCard.styles';

interface SummaryCardValue {
  units?: string;
  value: JSX.Element;
}

interface SummaryCardProps {
  firstValue: SummaryCardValue;
  isLoading?: boolean;
  secondValue?: SummaryCardValue;
  title: string;
  useSkeletonLoading?: boolean;
}

const SummaryCard = ({
  firstValue,
  isLoading,
  secondValue,
  title,
  useSkeletonLoading = false,
}: SummaryCardProps) => {
  const {
    classes: {
      cardContainer,
      cardContainerWithMultiple,
      metricDivider,
      metricDividerContainer,
      multipleStatsContainer,
      noWrapText,
      skeletonValueContainer,
      statContainer,
    },
    cx,
  } = useSummaryCardStyles();

  const firstSection = (
    <div className={statContainer}>
      <span className={`text-heading-large ${noWrapText}`}>{firstValue.value}</span>
      {firstValue.units && (
        <span className={`text-body-medium content-muted ${noWrapText}`}>{firstValue.units}</span>
      )}
    </div>
  );

  const secondSection = secondValue ? (
    <>
      <div className={metricDividerContainer}>
        <Divider className={metricDivider} orientation='vertical' />
      </div>
      <div className={statContainer}>
        <span className={`text-heading-large ${noWrapText}`}>{secondValue.value}</span>
        {secondValue.units && (
          <span className={`text-body-medium content-muted ${noWrapText}`}>
            {secondValue.units}
          </span>
        )}
      </div>
    </>
  ) : null;

  // Always show the title - it's a static label that doesn't need skeleton loading
  const titleContent = <span className={`text-label-large ${noWrapText}`}>{title}</span>;

  const valueContent =
    isLoading && useSkeletonLoading ? (
      <>
        <div className={skeletonValueContainer}>
          <Skeleton className='height-[40px] width-[70%]' data-testid='summary-card-skeleton' />
        </div>
        {secondValue && (
          <>
            <div className={metricDividerContainer}>
              <Divider className={metricDivider} orientation='vertical' />
            </div>
            <div className={skeletonValueContainer}>
              <Skeleton className='height-[40px] width-[70%]' data-testid='summary-card-skeleton' />
            </div>
          </>
        )}
      </>
    ) : (
      <>
        {firstSection}
        {secondSection}
      </>
    );

  return (
    <div
      className={cx({
        [cardContainer]: !secondValue,
        [cardContainerWithMultiple]: !!secondValue,
      })}>
      <Card density='Default' variant='Emphasis'>
        <div className='flex flex-col gap-small'>
          {titleContent}
          <div className={multipleStatsContainer}>{valueContent}</div>
        </div>
      </Card>
    </div>
  );
};

export default SummaryCard;
