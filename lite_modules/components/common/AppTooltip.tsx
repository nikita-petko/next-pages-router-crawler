import { Tooltip, TooltipTrigger, type TTooltipProps } from '@rbx/foundation-ui';
import { ReactElement, useState } from 'react';

interface AppTooltipProps extends Omit<TTooltipProps, 'children' | 'position'> {
  /**
   * The trigger element. It is wrapped in `TooltipTrigger asChild`, so it must be a
   * single element that forwards its ref and spreads props (buttons, icons, inputs,
   * or a wrapping `<span>`/`<div>`).
   */
  children: ReactElement;
  /**
   * Position of the tooltip relative to the trigger. Defaults to `top-start`.
   */
  position?: TTooltipProps['position'];
  /**
   * When true, keep the tooltip hidden even while the trigger is hovered/focused.
   * Use to stop a tooltip from showing at the same time as a neighbouring one
   * (e.g. an info icon nested inside a larger tooltip trigger).
   */
  suppressed?: boolean;
}

/**
 * The single tooltip abstraction for the ads manager, layered on top of the
 * Foundation (Radix) `Tooltip`. Always prefer this over importing `Tooltip` /
 * `TooltipTrigger` from `@rbx/foundation-ui` directly. It folds in two behaviours
 * that Foundation's primitive lacks:
 *
 * 1. Conditional render — when `title` (and `description`) are empty it renders the
 *    child alone, matching the WebBlox/MUI "empty title shows nothing" behaviour.
 *    Radix would otherwise pop an empty box on hover. Many disabled-field tooltips
 *    compute their text conditionally and fall back to `''`.
 * 2. Suppression — pass `suppressed` to force the tooltip closed without emptying
 *    the title, so nested triggers stay mounted (no remount flicker) and two
 *    tooltips never show at once.
 *
 * It also transparently forwards every Foundation `Tooltip` prop (`description`,
 * `hasBeak`, `ariaLabel`, `delayDurationMs`, `contentClassName`, controlled
 * `open`/`onOpenChange`) and wraps the child in `TooltipTrigger asChild` for you.
 *
 * For interactive tooltip content use `EducationalTooltip`; this component (like
 * Foundation's `Tooltip`) is for non-interactive content only.
 */
const AppTooltip = ({
  children,
  contentClassName,
  description,
  onOpenChange,
  open,
  position = 'top-start',
  suppressed,
  title,
  ...tooltipProps
}: AppTooltipProps): ReactElement => {
  const [internalOpen, setInternalOpen] = useState<boolean>(false);
  const mergedContentClassName = [
    'max-width-[calc(var(--size-100)*50)]',
    'text-wrap',
    contentClassName,
  ]
    .filter(Boolean)
    .join(' ');

  if (!title && !description) {
    return children;
  }

  const isControlled = open !== undefined;
  const usesSuppression = suppressed !== undefined;

  let openProp: boolean | undefined;
  let handleOpenChange: ((next: boolean) => void) | undefined;

  if (isControlled) {
    // Caller drives the open state; suppression can still force it closed.
    openProp = suppressed ? false : open;
    handleOpenChange = onOpenChange;
  } else if (usesSuppression) {
    // Track hover internally so we can override it with `suppressed`.
    openProp = internalOpen && !suppressed;
    handleOpenChange = (next: boolean) => {
      setInternalOpen(next);
      onOpenChange?.(next);
    };
  } else {
    // Fully uncontrolled: let Radix manage hover/focus itself.
    openProp = undefined;
    handleOpenChange = onOpenChange;
  }

  return (
    <Tooltip
      {...tooltipProps}
      contentClassName={mergedContentClassName}
      description={description}
      onOpenChange={handleOpenChange}
      open={openProp}
      position={position}
      title={title}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
    </Tooltip>
  );
};

export default AppTooltip;
