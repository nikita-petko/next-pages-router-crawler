import type { FC, ReactNode } from 'react';
import React, { memo, useCallback, useState } from 'react';
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

type ChartCardHeaderActionBase = {
  readonly id: string;
  readonly label: string;
  readonly tooltip?: string;
  readonly disabled?: boolean;
  readonly testId?: string;
};

export type ChartCardHeaderButtonAction = ChartCardHeaderActionBase & {
  readonly kind: 'button';
  readonly onClick: () => void;
  readonly icon?: ReactNode;
  readonly renderButton?: (props: {
    readonly action: ChartCardHeaderButtonAction;
    readonly defaultButton: ReactNode;
  }) => ReactNode;
};

export type ChartCardHeaderLinkAction = ChartCardHeaderActionBase & {
  readonly kind: 'link';
  readonly href: string;
  readonly icon?: ReactNode;
  /** Anchor `target` (e.g. `'_blank'` to open the link in a new tab). */
  readonly target?: string;
  /** Anchor `rel`; set to `'noopener noreferrer'` when using `target='_blank'`. */
  readonly rel?: string;
  readonly renderLink?: (props: {
    readonly action: ChartCardHeaderLinkAction;
    readonly defaultLink: ReactNode;
  }) => ReactNode;
};

export type ChartCardHeaderMenuAction = ChartCardHeaderActionBase & {
  readonly kind: 'menu';
  readonly icon?: ReactNode;
  readonly items: readonly ChartCardHeaderAction[];
  readonly renderMenu?: (props: {
    readonly action: ChartCardHeaderMenuAction;
    readonly items: readonly ChartCardHeaderAction[];
  }) => ReactNode;
};

export type ChartCardHeaderCustomAction = ChartCardHeaderActionBase & {
  readonly kind: 'custom';
  readonly render: (props?: { readonly closeMenu?: () => void }) => ReactNode;
  readonly renderOverlay?: () => ReactNode;
};

export type ChartCardHeaderAction =
  | ChartCardHeaderButtonAction
  | ChartCardHeaderLinkAction
  | ChartCardHeaderMenuAction
  | ChartCardHeaderCustomAction;

export type ChartCardHeaderActionsProps = {
  readonly actions: readonly ChartCardHeaderAction[];
};

/**
 * Default chart card header action region. Standard actions render with
 * analytics-ui chrome; callers can supply custom renderers for product-owned UI.
 */
const ChartCardHeaderActions: FC<ChartCardHeaderActionsProps> = ({ actions }) => {
  if (!actions.length) {
    return null;
  }

  return (
    <>
      {actions.map((action) => (
        <ChartCardHeaderActionItem action={action} key={action.id} />
      ))}
    </>
  );
};

/**
 * Wraps a Foundation trigger element with a Tooltip when a non-empty tooltip is
 * supplied and the control is enabled. Disabled controls intentionally render
 * without a tooltip to mirror the previous behaviour.
 */
const withTooltip = (
  tooltip: string | undefined,
  disabled: boolean | undefined,
  child: ReactNode,
): ReactNode =>
  tooltip && !disabled ? (
    <Tooltip title={tooltip} position='bottom-end'>
      <TooltipTrigger asChild>{child}</TooltipTrigger>
    </Tooltip>
  ) : (
    <>{child}</>
  );

const ChartCardHeaderActionItem: FC<{ readonly action: ChartCardHeaderAction }> = ({ action }) => {
  switch (action.kind) {
    case 'button':
      return <ChartCardHeaderButton action={action} />;
    case 'link':
      return <ChartCardHeaderLink action={action} />;
    case 'menu':
      return <ChartCardHeaderMenu action={action} />;
    case 'custom':
      return <>{action.render()}</>;
    default:
      return null;
  }
};

const ChartCardHeaderButton: FC<{ readonly action: ChartCardHeaderButtonAction }> = ({
  action,
}) => {
  const { disabled, icon, label, onClick, testId, tooltip } = action;
  const defaultButton = withTooltip(
    tooltip,
    disabled,
    <Button
      onClick={onClick}
      variant='Standard'
      size='Medium'
      isDisabled={disabled}
      className={icon ? 'min-width-fit' : undefined}
      aria-label={icon ? label : undefined}
      data-testid={testId}>
      {icon ?? label}
    </Button>,
  );

  return <>{action.renderButton?.({ action, defaultButton }) ?? defaultButton}</>;
};

const ChartCardHeaderLink: FC<{ readonly action: ChartCardHeaderLinkAction }> = ({ action }) => {
  const { disabled, href, icon, label, rel, target, testId, tooltip } = action;
  const defaultLink = withTooltip(
    tooltip,
    disabled,
    <Button
      as='a'
      href={disabled ? undefined : href}
      target={target}
      rel={rel}
      variant='Standard'
      size='Small'
      isDisabled={disabled}
      className={icon ? 'min-width-fit' : undefined}
      aria-label={icon ? label : undefined}
      data-testid={testId}>
      {icon ?? label}
    </Button>,
  );

  return <>{action.renderLink?.({ action, defaultLink }) ?? defaultLink}</>;
};

const ChartCardHeaderMenu: FC<{ readonly action: ChartCardHeaderMenuAction }> = ({ action }) => {
  const { disabled, items, label, renderMenu, testId, tooltip } = action;
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // `PopoverTrigger asChild` and `TooltipTrigger asChild` both forward their
  // props onto the underlying `IconButton`, so they can be nested when a
  // tooltip is present.
  const trigger = (
    <PopoverTrigger asChild>
      <IconButton
        icon='icon-filled-three-dots-vertical'
        variant='Standard'
        size='Small'
        ariaLabel={label}
        isDisabled={disabled}
        data-testid={testId}
      />
    </PopoverTrigger>
  );

  const defaultMenu = (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        {tooltip && !disabled ? (
          <Tooltip title={tooltip} position='bottom-end'>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          </Tooltip>
        ) : (
          trigger
        )}
        <PopoverContent side='bottom' align='end' ariaLabel={label}>
          <Menu size='Medium'>
            <MenuSection>
              {items.map((item) => (
                <DefaultMenuItem action={item} key={item.id} onClose={handleClose} />
              ))}
            </MenuSection>
          </Menu>
        </PopoverContent>
      </Popover>
      {items.map((item) =>
        item.kind === 'custom' && item.renderOverlay ? (
          <React.Fragment key={`${item.id}-overlay`}>{item.renderOverlay()}</React.Fragment>
        ) : null,
      )}
    </>
  );

  return <>{renderMenu?.({ action, items }) ?? defaultMenu}</>;
};

const DefaultMenuItem: FC<{
  readonly action: ChartCardHeaderAction;
  readonly onClose: () => void;
}> = ({ action, onClose }) => {
  const handleSelect = useCallback(() => {
    if (action.kind === 'button') {
      action.onClick();
    }
    onClose();
  }, [action, onClose]);

  if (action.kind === 'button') {
    return (
      <MenuItem
        value={action.id}
        title={action.label}
        disabled={action.disabled}
        onSelect={handleSelect}
        data-testid={action.testId}
      />
    );
  }

  if (action.kind === 'link') {
    return (
      <MenuItem
        as='a'
        value={action.id}
        title={action.label}
        href={action.disabled ? undefined : action.href}
        target={action.target}
        rel={action.rel}
        disabled={action.disabled}
        onSelect={onClose}
        data-testid={action.testId}
      />
    );
  }

  if (action.kind === 'custom') {
    return <>{action.render({ closeMenu: onClose })}</>;
  }

  return null;
};

export default memo(ChartCardHeaderActions);
