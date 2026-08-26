import type { FC } from 'react';
import { OverflowTitle } from '@rbx/analytics-ui';
import { Button, Link } from '@rbx/foundation-ui';
import { useManagePageTranslations } from '../useManagePageTranslations';
import ManagePageOverflowMenu from './ManagePageOverflowMenu';

const CREATE_LIMIT_DESCRIPTION_ID = 'custom-dashboards-create-limit';

/**
 * Manage-page header. Stays invariant across render states (Loading / Empty /
 * List / No-matches) so the chrome doesn't jitter as content swaps below.
 */
type ManagePageHeaderStackProps = {
  readonly learnMoreHref: string;
  readonly isCreateEnabled: boolean;
  readonly onCreateClick: () => void;
  readonly onRefresh: () => void;
  readonly maxDashboardsPerUniverse?: number;
};

const ManagePageHeaderStack: FC<ManagePageHeaderStackProps> = ({
  learnMoreHref,
  isCreateEnabled,
  onCreateClick,
  onRefresh,
  maxDashboardsPerUniverse,
}) => {
  const t = useManagePageTranslations();
  const formattedLimit =
    maxDashboardsPerUniverse === undefined
      ? undefined
      : new Intl.NumberFormat().format(maxDashboardsPerUniverse);

  return (
    <header className='flex flex-col small:flex-row small:items-start small:justify-between gap-medium'>
      <div className='flex flex-col gap-xsmall min-width-0'>
        <OverflowTitle
          as='h1'
          text={t.pageTitle}
          className='text-heading-large content-emphasis margin-none text-truncate-end'
        />
        <p className='text-body-medium content-default margin-none'>
          {t.pageSubtitle}{' '}
          <Link href={learnMoreHref} target='_blank' rel='noreferrer' size='Medium'>
            {t.learnMoreLabel}
          </Link>
        </p>
        {formattedLimit === undefined ? null : (
          <p
            id={CREATE_LIMIT_DESCRIPTION_ID}
            className='text-body-medium content-muted margin-none'>
            {t.createLimitDescription({ limit: formattedLimit })}
          </p>
        )}
      </div>

      <div className='flex items-center gap-small shrink-0'>
        <Button
          variant='Emphasis'
          size='Medium'
          onClick={onCreateClick}
          isDisabled={!isCreateEnabled}
          aria-describedby={formattedLimit === undefined ? undefined : CREATE_LIMIT_DESCRIPTION_ID}>
          {t.createButtonLabel}
        </Button>
        <ManagePageOverflowMenu onRefresh={onRefresh} />
      </div>
    </header>
  );
};

export default ManagePageHeaderStack;
