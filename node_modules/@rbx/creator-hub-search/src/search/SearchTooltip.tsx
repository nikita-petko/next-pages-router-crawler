import React, { useEffect, useRef } from 'react';
import { Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { getKeyboardShortcut } from './utils/getSearchKeyboardShortcut';

const TOOLTIP_Z_INDEX = '1100';
const TOOLTIP_TITLE_FONT_SIZE = '14px';

interface SearchTooltipProps {
  open: boolean;
  onDismiss: () => void;
  children: React.ReactElement;
}

export default function SearchTooltip({ open, onDismiss, children }: SearchTooltipProps) {
  const { translate } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const shortcut = getKeyboardShortcut('K');

  const description = (translate('Description.SearchTooltip', {
    shortcut,
  }) ||
    `Search documentation and Creator Hub pages instantly. Press ${shortcut} to get started.`) as string;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const raf = requestAnimationFrame(() => {
      const popperWrapper = wrapperRef.current?.querySelector(
        '[data-radix-popper-content-wrapper]',
      ) as HTMLElement | null;
      if (popperWrapper) {
        popperWrapper.style.zIndex = TOOLTIP_Z_INDEX;
        const titleEl = popperWrapper.querySelector('.text-caption-medium') as HTMLElement | null;
        if (titleEl) {
          titleEl.style.fontSize = TOOLTIP_TITLE_FONT_SIZE;
        }
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClick = () => onDismiss();
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClick, { once: true });
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
    };
  }, [open, onDismiss]);

  return (
    <div ref={wrapperRef}>
      <Tooltip
        hasBeak
        delayDurationMs={0}
        open={open}
        onOpenChange={() => {}}
        title={(translate('Label.SearchTooltipTitle') || 'Global search is here!') as string}
        description={description}
        position='bottom-center'>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
      </Tooltip>
    </div>
  );
}
