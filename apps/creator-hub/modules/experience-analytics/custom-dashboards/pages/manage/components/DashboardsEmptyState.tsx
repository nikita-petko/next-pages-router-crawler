import type { FC } from 'react';
import { Button } from '@rbx/foundation-ui';
import DashboardsEmptyStateIllustration from '../../../components/DashboardsEmptyStateIllustration';
import { useManagePageTranslations } from '../useManagePageTranslations';

/**
 * Centered empty-state replacing the entire search / table / pagination
 * block when the experience has zero dashboards.
 */
type DashboardsEmptyStateProps = {
  readonly isCreateEnabled: boolean;
  readonly onCreateClick: () => void;
};

const DashboardsEmptyState: FC<DashboardsEmptyStateProps> = ({
  isCreateEnabled,
  onCreateClick,
}) => {
  const t = useManagePageTranslations();
  return (
    <div className='flex width-full min-width-0 grow radius-medium stroke-standard stroke-default min-height-[calc(100vh-360px)]'>
      <div className='flex grow flex-col items-center justify-center text-align-x-center padding-x-medium medium:padding-x-large padding-y-large medium:padding-y-xxlarge min-width-0 width-full'>
        {/* 48px between illustration and text, 16px between text and CTA;
            mixed scales aren't expressible as a single column gap. */}
        <div className='margin-bottom-large'>
          <DashboardsEmptyStateIllustration />
        </div>
        {/* max-width sits one step above the text block so `items-center`
            doesn't collapse to the description's natural single-line width. */}
        <div className='flex flex-col items-center gap-large width-full min-width-0 max-width-[560px]'>
          <div className='flex flex-col items-center gap-xsmall width-full min-width-0'>
            <h2 className='text-label-large content-emphasis margin-none'>
              {t.emptyStateHeadline}
            </h2>
            <p className='text-body-medium content-muted margin-none'>{t.emptyStateDescription}</p>
          </div>
          <Button
            variant='Emphasis'
            size='Medium'
            isDisabled={!isCreateEnabled}
            onClick={onCreateClick}>
            {t.emptyStateCtaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardsEmptyState;
