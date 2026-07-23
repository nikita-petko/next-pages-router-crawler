import { ReactNode } from 'react';

import Skeleton from '@components/common/Skeleton';

interface AccountSummaryLineItemProps {
  isLoading?: boolean;
  label: ReactNode;
  value?: ReactNode;
}

const AccountSummaryLineItem = ({
  isLoading = false,
  label,
  value,
}: AccountSummaryLineItemProps) => (
  <span className='flex flex-col gap-small'>
    <span className='text-body-medium content-default'>{label}</span>
    {isLoading ? (
      <Skeleton
        className='height-[1.2em] width-[160px]'
        data-testid='account-summary-field-skeleton'
      />
    ) : (
      <span className='text-label-large'>{value}</span>
    )}
  </span>
);

export default AccountSummaryLineItem;
