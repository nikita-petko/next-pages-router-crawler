import type { FC, ReactElement, ReactNode } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Chip, Popover, PopoverContent, PopoverTrigger } from '@rbx/foundation-ui';
import { computeVisibleRpnChipSegmentCount } from '../utils/computeVisibleRpnChipSegmentCount';
import type { RpnTokenChipSegment } from '../utils/getRpnTokenChipSegments';
import RpnTokenChipSegmentRow, { RPN_TOKEN_CHIP_TEXT_CLASSNAME } from './RpnTokenChipSegmentRow';

const SEGMENT_GAP_PX = 4;
const ELLIPSIS_CHIP_TEXT = '…';
const HOVER_CLOSE_DELAY_MS = 100;
const OVERFLOW_POPOVER_MAX_HEIGHT_PX = 280;
const OVERFLOW_POPOVER_VIEWPORT_PADDING_PX = 32;
const OVERFLOW_POPOVER_COLLISION_PADDING_PX = 16;

const OVERFLOW_POPOVER_BODY_CLASSNAME =
  'flex flex-col items-stretch gap-small padding-medium bg-surface-100 stroke-standard stroke-default shadow-transient-high radius-medium overflow-y-auto';

const OVERFLOW_POPOVER_CHIP_CLASSNAME = `inline-flex max-w-full items-center justify-center radius-circle bg-shift-300 content-action-utility height-600 padding-left-small padding-right-small text-label-small break-words whitespace-normal ${RPN_TOKEN_CHIP_TEXT_CLASSNAME}`;

type ChipLayoutState = {
  visibleCount: number;
  segmentWidths: number[];
  containerWidth: number;
  ellipsisWidth: number;
};

const areNumberArraysEqual = (
  first: ReadonlyArray<number>,
  second: ReadonlyArray<number>,
): boolean =>
  first.length === second.length &&
  first.every((firstValue, index) => firstValue === second[index]);

const areChipLayoutsEqual = (first: ChipLayoutState, second: ChipLayoutState): boolean =>
  first.visibleCount === second.visibleCount &&
  first.containerWidth === second.containerWidth &&
  first.ellipsisWidth === second.ellipsisWidth &&
  areNumberArraysEqual(first.segmentWidths, second.segmentWidths);

type TargetingCriteriaChipsProps = {
  segments: ReadonlyArray<RpnTokenChipSegment>;
};

type HoverTargetingPopoverProps = {
  children: ReactElement;
  content: ReactNode;
  ariaLabel: string;
  isEnabled: boolean;
};

const HoverTargetingPopover: FC<HoverTargetingPopoverProps> = ({
  children,
  content,
  ariaLabel,
  isEnabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpen = useCallback(() => {
    if (!isEnabled) {
      return;
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  }, [isEnabled]);

  const handleClose = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, HOVER_CLOSE_DELAY_MS);
  }, []);

  if (!isEnabled) {
    return children;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <span
          className='inline-flex min-w-0 shrink'
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
          onFocus={handleOpen}
          onBlur={handleClose}>
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side='bottom'
        align='start'
        sideOffset={4}
        collisionPadding={OVERFLOW_POPOVER_COLLISION_PADDING_PX}
        ariaLabel={ariaLabel}
        onOpenAutoFocus={(event) => event.preventDefault()}>
        <div onMouseEnter={handleOpen} onMouseLeave={handleClose}>
          {content}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const OverflowPopoverChip: FC<{ segment: RpnTokenChipSegment }> = ({ segment }) => (
  <span
    data-testid='targeting-overflow-popover-chip'
    className={OVERFLOW_POPOVER_CHIP_CLASSNAME}
    style={{ width: 'max-content' }}>
    <span className='padding-y-xsmall'>{segment.text}</span>
  </span>
);

const renderOverflowChipList = (segments: ReadonlyArray<RpnTokenChipSegment>) => (
  <div
    data-testid='targeting-overflow-popover-body'
    className={OVERFLOW_POPOVER_BODY_CLASSNAME}
    style={{
      width: 'max-content',
      maxWidth: `calc(100vw - ${OVERFLOW_POPOVER_VIEWPORT_PADDING_PX}px)`,
      maxHeight: OVERFLOW_POPOVER_MAX_HEIGHT_PX,
    }}>
    {segments.map((segment) => (
      <OverflowPopoverChip key={segment.key} segment={segment} />
    ))}
  </div>
);

const emptyChipLayout: ChipLayoutState = {
  visibleCount: 0,
  segmentWidths: [],
  containerWidth: 0,
  ellipsisWidth: 0,
};

const TargetingCriteriaChips: FC<TargetingCriteriaChipsProps> = ({ segments }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const ellipsisMeasureRef = useRef<HTMLDivElement>(null);
  const [chipLayout, setChipLayout] = useState<ChipLayoutState>({
    visibleCount: segments.length,
    segmentWidths: [],
    containerWidth: 0,
    ellipsisWidth: 0,
  });

  const getConstraintWidth = useCallback((container: HTMLElement): number => {
    return container.parentElement?.clientWidth ?? container.clientWidth;
  }, []);

  const recomputeChipLayout = useCallback(() => {
    const container = containerRef.current;
    const measureContainer = measureRef.current;
    const ellipsisMeasure = ellipsisMeasureRef.current;
    if (!container || !measureContainer || segments.length === 0) {
      setChipLayout((previous) =>
        areChipLayoutsEqual(previous, emptyChipLayout) ? previous : emptyChipLayout,
      );
      return;
    }

    const segmentElements = measureContainer.querySelectorAll<HTMLElement>('[data-chip-segment]');
    const segmentWidths = Array.from(segmentElements).map((element) => element.offsetWidth);
    const ellipsisWidth = ellipsisMeasure?.offsetWidth ?? 0;
    const containerWidth = getConstraintWidth(container);

    const visibleCount = computeVisibleRpnChipSegmentCount({
      segmentWidths,
      containerWidth,
      ellipsisWidth,
    });

    const nextLayout = { visibleCount, segmentWidths, containerWidth, ellipsisWidth };
    setChipLayout((previous) =>
      areChipLayoutsEqual(previous, nextLayout) ? previous : nextLayout,
    );
  }, [getConstraintWidth, segments]);

  useLayoutEffect(() => {
    recomputeChipLayout();

    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const constraintElement = container.parentElement;

    const resizeObserver = new ResizeObserver(recomputeChipLayout);
    if (constraintElement) {
      resizeObserver.observe(constraintElement);
    }
    return () => resizeObserver.disconnect();
  }, [recomputeChipLayout]);

  if (segments.length === 0) {
    return null;
  }

  const { visibleCount, segmentWidths, containerWidth } = chipLayout;
  const visibleSegments = segments.slice(0, visibleCount);
  const hiddenSegments = segments.slice(visibleCount);
  const showOverflowChip = hiddenSegments.length > 0;
  const isSingleVisibleChip = visibleCount === 1;

  return (
    <div
      ref={containerRef}
      data-testid='targeting-criteria-container'
      className='w-fit max-w-full min-w-0 overflow-hidden'>
      <div
        ref={measureRef}
        aria-hidden
        className='flex items-center'
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          height: 0,
          overflow: 'hidden',
          gap: SEGMENT_GAP_PX,
        }}>
        {segments.map((segment) => (
          <span
            key={`measure-${segment.key}`}
            data-chip-segment
            className='inline-flex items-center'
            style={{ gap: SEGMENT_GAP_PX }}>
            <RpnTokenChipSegmentRow
              segments={[segment]}
              showJoiners={false}
              chipTextClassName={RPN_TOKEN_CHIP_TEXT_CLASSNAME}
            />
          </span>
        ))}
        <span ref={ellipsisMeasureRef} data-ellipsis-measure className='inline-flex'>
          <Chip
            text={ELLIPSIS_CHIP_TEXT}
            size='Small'
            variant='Standard'
            isChecked={false}
            className={RPN_TOKEN_CHIP_TEXT_CLASSNAME}
            style={{ pointerEvents: 'none', flexShrink: 0 }}
          />
        </span>
      </div>

      <div
        data-testid='targeting-criteria-visible-chips'
        className='flex flex-nowrap items-center min-w-0 overflow-hidden max-w-full'
        style={{ gap: SEGMENT_GAP_PX, flexWrap: 'nowrap' }}>
        {visibleSegments.map((segment, index) => {
          const naturalWidth = segmentWidths[index] ?? 0;
          const maxWidth = isSingleVisibleChip
            ? naturalWidth > containerWidth && containerWidth > 0
              ? containerWidth
              : undefined
            : undefined;
          const isTruncated = maxWidth !== undefined;

          const chip = (
            <span
              className={isTruncated ? 'inline-flex min-w-0 shrink' : 'inline-flex shrink-0'}
              style={maxWidth !== undefined ? { maxWidth } : undefined}>
              <Chip
                text={segment.text}
                size='Small'
                variant='Standard'
                isChecked={false}
                className={RPN_TOKEN_CHIP_TEXT_CLASSNAME}
                style={{
                  maxWidth: isTruncated ? '100%' : undefined,
                  minWidth: isTruncated ? 0 : undefined,
                  flexShrink: isTruncated ? 1 : 0,
                  pointerEvents: 'none',
                }}
              />
            </span>
          );

          return (
            <HoverTargetingPopover
              key={segment.key}
              isEnabled={isTruncated}
              ariaLabel={segment.text}
              content={renderOverflowChipList([segment])}>
              {chip}
            </HoverTargetingPopover>
          );
        })}
        {showOverflowChip ? (
          <HoverTargetingPopover
            isEnabled
            ariaLabel='Additional targeting criteria'
            content={renderOverflowChipList(hiddenSegments)}>
            <span className='inline-flex shrink-0'>
              <Chip
                text={ELLIPSIS_CHIP_TEXT}
                size='Small'
                variant='Standard'
                isChecked={false}
                className={RPN_TOKEN_CHIP_TEXT_CLASSNAME}
                style={{ pointerEvents: 'none' }}
              />
            </span>
          </HoverTargetingPopover>
        ) : null}
      </div>
    </div>
  );
};

export default TargetingCriteriaChips;
