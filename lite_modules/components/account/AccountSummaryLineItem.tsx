import { IconButton } from '@rbx/foundation-ui';
import { ReactNode } from 'react';

import Skeleton from '@components/common/Skeleton';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface AccountSummaryLineItemProps {
  copyValue?: string;
  isLoading?: boolean;
  label: ReactNode;
  value?: ReactNode;
}

const AccountSummaryLineItem = ({
  copyValue,
  isLoading = false,
  label,
  value,
}: AccountSummaryLineItemProps) => {
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);

  return (
    <span className='flex flex-col gap-small'>
      <span className='text-body-medium content-default'>{label}</span>
      {isLoading ? (
        <Skeleton
          className='height-[1.2em] width-[160px]'
          data-testid='account-summary-field-skeleton'
        />
      ) : (
        <span className='flex items-center gap-xsmall'>
          <span className='text-label-large'>{value}</span>
          {copyValue ? (
            <IconButton
              ariaLabel={translateReport('Description.CopyToClipboard')}
              icon='icon-regular-two-stacked-squares'
              onClick={() => {
                navigator.clipboard.writeText(copyValue).catch(() => {});
              }}
              size='XSmall'
              variant='Utility'
            />
          ) : null}
        </span>
      )}
    </span>
  );
};

export default AccountSummaryLineItem;
