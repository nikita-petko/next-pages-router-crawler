import type { FC } from 'react';
import { Button, Link } from '@rbx/foundation-ui';
import { useManagePageTranslations } from '../useManagePageTranslations';
import ManagePageOverflowMenu from './ManagePageOverflowMenu';

/**
 * Manage-page header. Stays invariant across render states (Loading / Empty /
 * List / No-matches) so the chrome doesn't jitter as content swaps below.
 */
type ManagePageHeaderStackProps = {
  readonly learnMoreHref: string;
  readonly isCreateEnabled: boolean;
  readonly onCreateClick: () => void;
  readonly onRefresh: () => void;
};

const ManagePageHeaderStack: FC<ManagePageHeaderStackProps> = ({
  learnMoreHref,
  isCreateEnabled,
  onCreateClick,
  onRefresh,
}) => {
  const t = useManagePageTranslations();

  return (
    <header className='flex flex-col small:flex-row small:items-start small:justify-between gap-medium'>
      <div className='flex flex-col gap-xsmall min-width-0'>
        <h1 className='text-heading-large content-emphasis margin-none text-truncate-end'>
          {t.pageTitle}
        </h1>
        <p className='text-body-medium content-default margin-none'>
          {t.pageSubtitle}{' '}
          <Link href={learnMoreHref} target='_blank' rel='noreferrer' size='Medium'>
            {t.learnMoreLabel}
          </Link>
        </p>
      </div>

      <div className='flex items-center gap-small shrink-0'>
        <Button
          variant='Emphasis'
          size='Medium'
          onClick={onCreateClick}
          isDisabled={!isCreateEnabled}>
          {t.createButtonLabel}
        </Button>
        <ManagePageOverflowMenu onRefresh={onRefresh} />
      </div>
    </header>
  );
};

export default ManagePageHeaderStack;
