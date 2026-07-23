import { memo } from 'react';
import {
  Tooltip as FoundationTooltip,
  TooltipTrigger as FoundationTooltipTrigger,
  type TTooltipProps as FoundationTooltipProps,
} from '@rbx/foundation-ui';

export type TTooltipProps = Omit<FoundationTooltipProps, 'position'> & {
  /** Position of tooltip. @default 'top-center' */
  position?: FoundationTooltipProps['position'];
  /** Whether the tooltip is disabled. */
  disabled?: boolean;
  /**
   * If true, the trigger ref will be forwarded to a slot element. Useful for
   * adding triggers to elements that disallow ref-forwarding.
   */
  addTriggerSlot?: boolean;
};

// Not strictly needed, just helps with debuggability on inspect
function Slot({ children, ...props }: React.ComponentPropsWithRef<'div'>) {
  return <div {...props}>{children}</div>;
}
Slot.displayName = 'Slot';

/**
 * Temporary wrapper for foundation tooltip to maintain similar behavior to MUI tooltip.
 * Solves for conditional tooltip - when disabled, the tooltip is not rendered.
 */
export const Tooltip = memo(
  ({ children, disabled, addTriggerSlot, position = 'top-center', ...props }: TTooltipProps) => {
    if (disabled) {
      return children;
    }

    if (addTriggerSlot) {
      return (
        <FoundationTooltip position={position} delayDurationMs={0} {...props}>
          <FoundationTooltipTrigger asChild>
            <Slot>{children}</Slot>
          </FoundationTooltipTrigger>
        </FoundationTooltip>
      );
    }

    return (
      <FoundationTooltip position={position} delayDurationMs={0} {...props}>
        <FoundationTooltipTrigger asChild>{children}</FoundationTooltipTrigger>
      </FoundationTooltip>
    );
  },
);
Tooltip.displayName = 'Tooltip';
