import type { FC, ReactNode } from 'react';
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import type { TChartConfiguratorMetrics } from '@modules/experience-analytics-shared/chartConfigurator/chartConfiguratorMetricsConfig';
import ExploreModeViewEventsCta from './ExploreModeViewEventsCta';

// 'Emphasis' is the page-primary blue button; 'Standard' is the secondary
// gray. Other Foundation Button variants aren't currently used in the
// explore-mode header, so we keep this surface narrow to make the design
// language explicit at every call site.
export type ExploreModeCtaButtonVariant = 'Emphasis' | 'Standard';

const DEFAULT_FEEDBACK_DURATION_MS = 1500;
// Gap between the bottom edge of the feedback chip and the top edge of the
// … trigger (viewport pixels). Menu feedback is portaled + `position:fixed`
// from `getBoundingClientRect`; the chip is anchored with `bottom` so it
// stays above the trigger even on the first paint (translateY(-100%) uses the
// chip's own height, which can be 0 before layout).
const MENU_FEEDBACK_VIEWPORT_GAP_PX = 8;
// Delay between a menu-item selection and showing the post-click feedback
// chip. The Radix Popover keeps its content mounted during its close
// animation + portal teardown, so flashing the chip immediately can paint
// the bubble over the still-visible menu surface. A short wait lets the
// popover finish unmounting before the chip appears.
const MENU_FEEDBACK_OPEN_DELAY_MS = 200;
// z-index for the portaled menu-feedback chip. The chip is appended to
// `document.body` and needs to stack above adjacent page surfaces (e.g.,
// sticky headers) without leaking above app-level overlays like dialogs.
// 100 mirrors the layering used for tooltip-style transient affordances
// elsewhere in the explore-mode header.
const MENU_FEEDBACK_Z_INDEX = 100;

// Click-feedback configuration for an inline button. The button's tooltip
// shows `hoverLabel` on hover, and briefly switches to `selectedLabel`
// after a successful click — pre-empting hover state for `durationMs`
// (defaults to ~1.5s). A click is treated as successful unless the
// onClick callback explicitly returns `false`.
export type ExploreModeCtaButtonFeedback = {
  hoverLabel: FormattedText;
  selectedLabel: FormattedText;
  durationMs?: number;
};

// Click-feedback configuration for a menu item. The menu closes on select
// so a tooltip on the item itself would be invisible; instead this flashes
// `selectedLabel` on the overflow trigger. Same success-gating rule as
// button feedback: any non-`false` return from onSelect is success.
export type ExploreModeCtaMenuItemFeedback = {
  selectedLabel: FormattedText;
  durationMs?: number;
};

type CtaActionResult = boolean | void;
type CtaActionCallback = () => Promise<CtaActionResult> | CtaActionResult;

type CtaButtonShared = {
  id: string;
  variant: ExploreModeCtaButtonVariant;
};

// A single CTA in the explore-mode page header.
//
// The action list is the single source of truth for both the inline-button
// row and the overflow menu, so callers don't have to mirror placement
// logic across two render trees. The list is consumed in declaration
// order: button-style actions render inline (left-to-right) and
// `menu-item` actions collect into the overflow popover at the right
// edge.
//
// `button` is the declarative shape — use it for plain CTAs whose UI is
// exhausted by a label + click handler (or a routed `href`). `feedback`
// adds a hover/post-click tooltip without any extra plumbing at the call
// site. `view-events` is the built-in live-events dialog trigger (returns
// null when the metric has no live-events counterpart). `custom-button`
// is the escape hatch for any future affordance that doesn't reduce to
// those shapes; the render closure receives `variant`.
export type ExploreModeCtaAction =
  | (CtaButtonShared & {
      kind: 'button';
      label: FormattedText;
      onClick?: CtaActionCallback;
      href?: string;
      disabled?: boolean;
      feedback?: ExploreModeCtaButtonFeedback;
    })
  | (CtaButtonShared & {
      kind: 'view-events';
      metric: TChartConfiguratorMetrics | null;
    })
  | (CtaButtonShared & {
      kind: 'custom-button';
      // Returning null is fine — the action will just contribute no visible
      // affordance.
      render: (props: { variant: ExploreModeCtaButtonVariant }) => ReactNode;
    })
  | {
      kind: 'menu-item';
      id: string;
      label: FormattedText;
      disabled?: boolean;
      onSelect: CtaActionCallback;
      feedback?: ExploreModeCtaMenuItemFeedback;
    };

type ExploreModeCTAsProps = {
  actions: readonly ExploreModeCtaAction[];
  moreOptionsLabel: FormattedText;
};

// Drives a transient label that auto-clears after `durationMs`. Used by
// both the button-feedback wrapper and the overflow-trigger tooltip so
// they share a single mental model. Exposed via `trigger(...)` rather
// than a raw setter so the cleanup-on-unmount and timeout-reset paths
// stay encapsulated.
function useTransientFeedback(): {
  activeLabel: FormattedText | null;
  trigger: (label: FormattedText, durationMs: number) => void;
} {
  const [activeLabel, setActiveLabel] = useState<FormattedText | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const trigger = useCallback((label: FormattedText, durationMs: number) => {
    setActiveLabel(label);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setActiveLabel(null);
    }, durationMs);
  }, []);

  return { activeLabel, trigger };
}

// Per-button helper: renders a Foundation Button wrapped in a Tooltip
// that flips between the action's `hoverLabel` and its post-click
// `selectedLabel`. The post-click state pre-empts hover for the
// configured duration so users see the "Copied!"-style feedback even if
// they're still moused over the button.
const FeedbackButton: FC<{
  variant: ExploreModeCtaButtonVariant;
  label: FormattedText;
  disabled?: boolean;
  onClick?: CtaActionCallback;
  feedback: ExploreModeCtaButtonFeedback;
}> = ({ variant, label, disabled, onClick, feedback }) => {
  const { activeLabel: activeFeedbackLabel, trigger: triggerFeedback } = useTransientFeedback();
  const [isHover, setIsHover] = useState(false);

  const handleClick = useCallback(async () => {
    const result = await onClick?.();
    if (result === false) {
      return;
    }
    triggerFeedback(feedback.selectedLabel, feedback.durationMs ?? DEFAULT_FEEDBACK_DURATION_MS);
  }, [onClick, feedback.selectedLabel, feedback.durationMs, triggerFeedback]);

  return (
    <Tooltip
      title={activeFeedbackLabel ?? feedback.hoverLabel}
      position='top-center'
      delayDurationMs={0}
      open={activeFeedbackLabel !== null || isHover}
      onOpenChange={setIsHover}>
      <TooltipTrigger asChild>
        <Button variant={variant} size='Medium' onClick={handleClick} isDisabled={disabled}>
          {label}
        </Button>
      </TooltipTrigger>
    </Tooltip>
  );
};

function renderInlineButton(
  action: Extract<ExploreModeCtaAction, { kind: 'button' | 'view-events' | 'custom-button' }>,
): ReactNode {
  if (action.kind === 'view-events') {
    return <ExploreModeViewEventsCta metric={action.metric} variant={action.variant} />;
  }
  if (action.kind === 'custom-button') {
    return action.render({ variant: action.variant });
  }
  // Foundation's Button has separate type unions for `as='a'` (link) and
  // the default `as='button'` shape. Branch on whether the action carries
  // an `href` so each renders against the correct prop set without an
  // `any`. `href` actions can't host click-feedback (we navigate away
  // before the tooltip would matter), so the feedback config is ignored
  // for them.
  if (action.href !== undefined) {
    return (
      <Button
        variant={action.variant}
        size='Medium'
        as='a'
        href={action.href}
        isDisabled={action.disabled}>
        {action.label}
      </Button>
    );
  }
  if (action.feedback) {
    return (
      <FeedbackButton
        variant={action.variant}
        label={action.label}
        disabled={action.disabled}
        onClick={action.onClick}
        feedback={action.feedback}
      />
    );
  }
  return (
    <Button
      variant={action.variant}
      size='Medium'
      onClick={action.onClick}
      isDisabled={action.disabled}>
      {action.label}
    </Button>
  );
}

const ExploreModeCTAs: FC<ExploreModeCTAsProps> = ({ actions, moreOptionsLabel }) => {
  // Radix Popover does not dismiss when the user picks an item inside
  // `PopoverContent` — only outside clicks / Escape close it by default.
  // Track `open` explicitly so every menu selection closes the overflow
  // panel immediately (and unmounts its portal) before we flash post-click
  // feedback on the trigger; otherwise the popover portal can stay open,
  // obscuring the tooltip and making it look like Share "did nothing".
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);

  const buttonActions = actions.filter(
    (
      action,
    ): action is Extract<
      ExploreModeCtaAction,
      { kind: 'button' | 'view-events' | 'custom-button' }
    > =>
      action.kind === 'button' || action.kind === 'view-events' || action.kind === 'custom-button',
  );
  const menuActions = actions.filter(
    (action): action is Extract<ExploreModeCtaAction, { kind: 'menu-item' }> =>
      action.kind === 'menu-item',
  );

  // The menu closes on select, so feedback for menu-item actions can't
  // live on the item itself — instead we briefly flash a tooltip on the
  // overflow trigger (the "..." icon button). Single feedback slot is
  // sufficient: only one menu item can have just been selected at a time.
  const { activeLabel: activeMenuFeedbackLabel, trigger: triggerMenuFeedback } =
    useTransientFeedback();

  const overflowMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [menuFeedbackAnchorRect, setMenuFeedbackAnchorRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (activeMenuFeedbackLabel === null) {
      setMenuFeedbackAnchorRect(null);
      return;
    }
    const el = overflowMenuTriggerRef.current;
    if (!el) {
      return;
    }
    setMenuFeedbackAnchorRect(el.getBoundingClientRect());
  }, [activeMenuFeedbackLabel]);

  const menuFeedbackDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (menuFeedbackDelayTimeoutRef.current) {
        clearTimeout(menuFeedbackDelayTimeoutRef.current);
      }
    },
    [],
  );

  const handleMenuItemSelect = useCallback(
    async (action: Extract<ExploreModeCtaAction, { kind: 'menu-item' }>) => {
      setOverflowMenuOpen(false);
      const result = await action.onSelect();
      if (action.feedback && result !== false) {
        // Wait for the popover exit animation + portal teardown before showing
        // feedback — otherwise the bubble can paint over the menu surface while
        // it is still visible. Anchoring uses `setTimeout` rather than a single
        // rAF because Radix keeps content mounted briefly during close.
        const label = action.feedback.selectedLabel;
        const duration = action.feedback.durationMs ?? DEFAULT_FEEDBACK_DURATION_MS;
        if (menuFeedbackDelayTimeoutRef.current) {
          clearTimeout(menuFeedbackDelayTimeoutRef.current);
        }
        menuFeedbackDelayTimeoutRef.current = setTimeout(() => {
          menuFeedbackDelayTimeoutRef.current = null;
          triggerMenuFeedback(label, duration);
        }, MENU_FEEDBACK_OPEN_DELAY_MS);
      }
    },
    [triggerMenuFeedback],
  );

  return (
    <div className='flex flex-row items-center shrink-0 gap-medium'>
      {buttonActions.map((action) => (
        // Wrap each rendered button in a keyed Fragment rather than
        // requiring custom render closures to thread a `key` through
        // themselves. Fragment is a no-op in the DOM so the parent's flex
        // `gap-medium` still applies between the rendered button elements.
        <Fragment key={action.id}>{renderInlineButton(action)}</Fragment>
      ))}
      {menuActions.length > 0 && (
        <>
          <Popover open={overflowMenuOpen} onOpenChange={setOverflowMenuOpen}>
            <PopoverTrigger asChild>
              <IconButton
                ref={overflowMenuTriggerRef}
                variant='Utility'
                size='Medium'
                icon='icon-filled-three-dots-horizontal'
                ariaLabel={moreOptionsLabel}
              />
            </PopoverTrigger>
            <PopoverContent side='bottom' align='end' ariaLabel={moreOptionsLabel}>
              <Menu size='Medium'>
                <MenuSection>
                  {menuActions.map((action) => (
                    <MenuItem
                      key={action.id}
                      value={action.id}
                      title={action.label}
                      disabled={action.disabled}
                      onSelect={() => {
                        void handleMenuItemSelect(action);
                      }}
                    />
                  ))}
                </MenuSection>
              </Menu>
            </PopoverContent>
          </Popover>
          {activeMenuFeedbackLabel !== null && menuFeedbackAnchorRect !== null
            ? createPortal(
                <output
                  aria-live='polite'
                  style={{
                    position: 'fixed',
                    left: menuFeedbackAnchorRect.left + menuFeedbackAnchorRect.width / 2,
                    // Anchor the chip's bottom edge above the ⋯ trigger. Using
                    // translateY(-100%) on the chip fails on first paint because
                    // % resolves against the chip's own box—often 0h before text
                    // metrics—and the bubble then stacks on top of the button.
                    bottom:
                      window.innerHeight -
                      menuFeedbackAnchorRect.top +
                      MENU_FEEDBACK_VIEWPORT_GAP_PX,
                    transform: 'translateX(-50%)',
                    zIndex: MENU_FEEDBACK_Z_INDEX,
                  }}
                  className='pointer-events-none min-width-max-content whitespace-nowrap radius-small bg-inverse-surface-0 padding-y-xsmall padding-x-small text-caption-medium content-inverse-default shadow-transient-low'>
                  {activeMenuFeedbackLabel}
                </output>,
                document.body,
              )
            : null}
        </>
      )}
    </div>
  );
};

export default ExploreModeCTAs;
