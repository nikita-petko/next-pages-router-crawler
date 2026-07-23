import type { FC } from 'react';
import { Icon, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useManagePageTranslations } from '../useManagePageTranslations';

const PinToSidebarColumnHeader: FC = () => {
  const t = useManagePageTranslations();

  return (
    <span className='inline-flex items-center gap-xxsmall'>
      <span>{t.columnPinToSidebar}</span>
      <Tooltip title={t.columnPinToSidebarTooltip} position='top-center'>
        <TooltipTrigger asChild>
          <button
            type='button'
            className='inline-flex content-muted cursor-help stroke-none bg-none padding-none'
            aria-label={t.columnPinToSidebarTooltip}>
            <Icon name='icon-regular-circle-i' size='Small' />
          </button>
        </TooltipTrigger>
      </Tooltip>
    </span>
  );
};

export default PinToSidebarColumnHeader;
