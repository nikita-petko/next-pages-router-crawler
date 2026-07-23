import { Skeleton, Typography } from '@rbx/ui';
import { ReactNode } from 'react';

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
  <Typography display='flex' flexDirection='column' gap={1}>
    <Typography color='secondary' variant='body2'>
      {label}
    </Typography>
    {isLoading ? (
      <Skeleton animate data-testid='account-summary-field-skeleton' variant='text' width={160} />
    ) : (
      <Typography variant='buttonMedium'>{value}</Typography>
    )}
  </Typography>
);

export default AccountSummaryLineItem;
