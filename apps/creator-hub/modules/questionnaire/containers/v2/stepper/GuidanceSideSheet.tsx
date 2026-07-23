import React, { FunctionComponent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  IconButton,
  SheetRoot,
  SheetContent,
  SheetTitle,
  SheetBody,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useMediaQuery } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Link } from '@modules/miscellaneous/common';
import { ROBLOX_COMMUNITY_STANDARDS } from '@modules/miscellaneous/common/constants/linkConstants';
import useMarkdownParser from '../../../parser/useMarkdownParser';

function findScrollParent(node: HTMLElement): HTMLElement | null {
  let parent = node.parentElement;
  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll') return parent;
    parent = parent.parentElement;
  }
  return null;
}

// Approximate height of the page title section ("Content Ratings" heading +
// its bottom padding) rendered by CreatorHubLayout above the questionnaire.
const PAGE_TITLE_HEIGHT = 48;

interface GuidanceSideSheetProps {
  open?: boolean;
  onClose: () => void;
  robloxGuidance: string;
  showViolationWarning?: boolean;
  onDismissWarning?: () => void;
  actionBarContainer?: HTMLElement | null;
}

// NOTE (@mbae 2026-02-17): Foundation Sheet doesn't fit this exact use case on desktop,
// so we use a custom implementation for desktop and Foundation Sheet for mobile (bottom sheet).
const GuidanceSideSheet: FunctionComponent<GuidanceSideSheetProps> = ({
  open = true,
  onClose,
  robloxGuidance,
  showViolationWarning = false,
  onDismissWarning,
  actionBarContainer,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { parseText } = useMarkdownParser();
  const isMobile = useMediaQuery('(max-width: 600px)');
  const renderedGuidance = useMemo(() => parseText(robloxGuidance), [parseText, robloxGuidance]);

  const violatingWarning = useMemo(
    () =>
      translateHTML('Description.GuidanceViolatingWarning', [
        {
          opening: 'warningBoldStart',
          closing: 'warningBoldEnd',
          content(chunks: React.ReactNode) {
            return <b>{chunks}</b>;
          },
        },
        {
          opening: 'communityStandardsLinkStart',
          closing: 'communityStandardsLinkEnd',
          content(chunks: React.ReactNode) {
            return (
              <Link href={ROBLOX_COMMUNITY_STANDARDS} target='_blank'>
                {chunks}
              </Link>
            );
          },
        },
      ]),
    [translateHTML],
  );

  const renderBody = () => {
    if (showViolationWarning) {
      return (
        <div className='flex flex-col fill items-center justify-center padding-x-xlarge gap-large'>
          <span className='text-body-large content-default text-center'>{violatingWarning}</span>
          <Button variant='Standard' size='Medium' onClick={onDismissWarning}>
            {translate('Action.Ok')}
          </Button>
        </div>
      );
    }
    return null;
  };

  const sheetRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobile) return;
    const scrollBody = sheetRef.current?.lastElementChild as HTMLElement | null;
    if (scrollBody) {
      scrollBody.scrollTop = 0;
    }
  }, [robloxGuidance, isMobile]);

  useEffect(() => {
    const sheet = sheetRef.current;
    const anchor = anchorRef.current;
    if (!sheet || !anchor || isMobile) return undefined;

    const scrollParent = findScrollParent(anchor);

    let rafId = 0;
    const update = () => {
      const scrollTop = scrollParent?.getBoundingClientRect().top ?? 0;
      const actionBarTop = actionBarContainer
        ? actionBarContainer.getBoundingClientRect().top
        : window.innerHeight;
      const anchorRect = anchor.getBoundingClientRect();

      sheet.style.top = `${Math.max(scrollTop, 0)}px`;
      sheet.style.bottom = `${Math.max(window.innerHeight - actionBarTop, 0)}px`;
      sheet.style.left = `${anchorRect.left}px`;
      sheet.style.width = `${anchorRect.width}px`;
    };

    const schedule = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    update();

    const observer = new ResizeObserver(schedule);
    if (scrollParent) observer.observe(scrollParent);
    if (actionBarContainer) observer.observe(actionBarContainer);
    const wrapper = actionBarContainer?.parentElement;
    if (wrapper) observer.observe(wrapper);
    if (scrollParent) {
      scrollParent.addEventListener('scroll', schedule, { passive: true });
    }
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      if (scrollParent) {
        scrollParent.removeEventListener('scroll', schedule);
      }
      window.removeEventListener('resize', schedule);
    };
  }, [isMobile, actionBarContainer, robloxGuidance, showViolationWarning]);

  if (isMobile) {
    return (
      <SheetRoot
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose();
        }}>
        <SheetContent closeLabel='Close guidance panel' aria-describedby={undefined}>
          <SheetTitle>{translate('Label.RobloxGuidance')}</SheetTitle>
          <SheetBody className='flex flex-col gap-xlarge padding-bottom-xlarge fill'>
            {renderBody() ?? renderedGuidance}
          </SheetBody>
        </SheetContent>
      </SheetRoot>
    );
  }

  return (
    <React.Fragment>
      <div ref={anchorRef} className='shrink-0 width-[360px] min-width-[320px]' />
      <div
        ref={sheetRef}
        className='fixed flex flex-col bg-surface-100 radius-large clip'
        style={{ zIndex: 20 }}>
        {/* Header */}
        <div className='flex items-center justify-between padding-x-xlarge padding-y-small shrink-0'>
          <span className='text-heading-small content-emphasis'>
            {translate('Label.RobloxGuidance')}
          </span>
          <IconButton
            icon='icon-regular-x-small'
            ariaLabel='Close guidance panel'
            variant='Utility'
            size='Large'
            onClick={onClose}
          />
        </div>

        {/* Body */}
        <div
          className='flex flex-col gap-xlarge padding-x-xlarge padding-bottom-xlarge scroll-y fill min-height-0'
          style={{ overscrollBehaviorY: 'contain' }}>
          {renderBody() ?? renderedGuidance}
        </div>
      </div>
    </React.Fragment>
  );
};

const GuidanceOpenButton: FunctionComponent<{ onClick: () => void }> = ({ onClick }) => {
  const { translate } = useTranslation();
  return (
    <Tooltip position='left-center' title={translate('Label.ViewGuidance')} delayDurationMs={200}>
      <TooltipTrigger asChild>
        <IconButton
          className='bg-surface-100'
          icon='icon-regular-book-open'
          ariaLabel='Open Roblox guidance'
          variant='Standard'
          size='Large'
          isCircular
          onClick={onClick}
        />
      </TooltipTrigger>
    </Tooltip>
  );
};

interface GuidanceFloatingButtonProps {
  onClick: () => void;
  actionBarContainer?: HTMLElement | null;
}

export const GuidanceFloatingButton: FunctionComponent<GuidanceFloatingButtonProps> = ({
  onClick,
  actionBarContainer,
}) => {
  const isMobile = useMediaQuery('(max-width: 600px)');
  const [actionBarHeight, setActionBarHeight] = useState(0);

  useEffect(() => {
    if (!actionBarContainer) return undefined;
    const update = () => setActionBarHeight(actionBarContainer.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(actionBarContainer);
    return () => observer.disconnect();
  }, [actionBarContainer]);

  if (isMobile) {
    return (
      <div className='fixed right-[24px]' style={{ zIndex: 1000, bottom: actionBarHeight + 24 }}>
        <GuidanceOpenButton onClick={onClick} />
      </div>
    );
  }

  return (
    <div
      className='shrink-0 flex flex-col radius-large'
      style={{
        marginTop: -PAGE_TITLE_HEIGHT,
        alignSelf: 'stretch',
      }}>
      <div
        className='sticky flex items-center justify-center'
        style={{ bottom: actionBarHeight + 16, marginTop: 'auto' }}>
        <GuidanceOpenButton onClick={onClick} />
      </div>
    </div>
  );
};

export default GuidanceSideSheet;
