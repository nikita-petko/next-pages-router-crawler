import type { FC } from 'react';
import { Button } from '@rbx/foundation-ui';
import { CustomDashboardNotAvailableError } from '../../../errors';
import { useManagePageTranslations } from '../useManagePageTranslations';

/**
 * Table-area sub-view when the list query fails. NOT_AVAILABLE (SSR / private
 * mode) skips the retry button since the cause won't recover without the user
 * changing context. Cause-specific copy lives in the storage-failure toast
 * slot above the page; this component owns only the table-area placeholder.
 */
type DashboardsErrorStateProps = {
  readonly error: unknown;
  readonly onRetry: () => void;
};

const DashboardsErrorState: FC<DashboardsErrorStateProps> = ({ error, onRetry }) => {
  const t = useManagePageTranslations();
  const isNotAvailable = error instanceof CustomDashboardNotAvailableError;

  if (isNotAvailable) {
    return (
      <div
        role='alert'
        className='flex flex-col items-center text-align-x-center padding-y-xlarge gap-small'>
        <p className='text-label-medium content-emphasis margin-none'>{t.notAvailableHeadline}</p>
      </div>
    );
  }

  return (
    <div
      role='alert'
      className='flex flex-col items-center text-align-x-center padding-y-xlarge gap-small'>
      <p className='text-body-medium content-muted margin-none'>{t.errorStateHeadline}</p>
      <Button variant='Standard' size='Small' onClick={onRetry}>
        {t.errorStateRetryLabel}
      </Button>
    </div>
  );
};

export default DashboardsErrorState;
