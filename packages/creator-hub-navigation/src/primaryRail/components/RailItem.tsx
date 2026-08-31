import React, { useCallback } from 'react';
import Link from 'next/link';
import { Button, Grow, Tooltip, Typography } from '@rbx/ui';
import { useRailContext } from '../../layout/providers/RailProvider';
import isModifiedClick from '../../utils/isModifiedClick';
import withNavAdornmentSize from '../../utils/withNavAdornmentSize';
import useRailStyles from './Rail.styles';

type TRailItemProps = {
  icon: React.ReactNode;
  active?: boolean;
  activeIcon?: React.ReactNode;
  label?: React.ReactNode;
  ariaLabel?: string;
  adornment?: React.ReactNode;
  bottom?: boolean;
  compact?: boolean;
  fixedIcon?: boolean;
  iconOnlyHover?: boolean;
  /** When true, skips the built-in WebBlox tooltip (e.g. when a Foundation Tooltip wraps this item). */
  disableTooltip?: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  href?: string;
  enableAnimation?: boolean;
};

const RailItem = React.forwardRef<HTMLDivElement, TRailItemProps>(function RailItem(
  {
    onClick,
    icon,
    active = false,
    activeIcon,
    label,
    ariaLabel,
    adornment,
    compact = false,
    bottom = false,
    fixedIcon = false,
    iconOnlyHover = false,
    disableTooltip = false,
    enableAnimation = false,
    href,
  },
  ref,
) {
  const { iconOnly, isReady, shouldAnimate } = useRailContext();
  const useIconStyle = iconOnly || fixedIcon;
  // Keep tooltips off during rail transitions so they don't open mid-animation.
  const showTooltip = !disableTooltip && useIconStyle && !shouldAnimate && Boolean(label);
  const {
    cx,
    classes: {
      railItem,
      railItemVertical,
      railItemBottom,
      railItemWrapper,
      railItemNoHover,
      railItemIconOnly,
      startIcon,
      startIconCompact,
      startIconTransition,
      verticalLabel,
      labelTransition,
      labelHidden,
      label: labelClass,
    },
  } = useRailStyles();

  const onClickWrapper: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      if (href && isModifiedClick(e)) {
        return;
      }
      onClick(e);
    },
    [href, onClick],
  );

  const startIconEl = active && activeIcon ? activeIcon : icon;
  const textVariant = compact && !useIconStyle ? 'captionSmall' : 'largeLabel2';

  const buttonProps = {
    onClick: onClickWrapper,
    variant: 'text',
    disableRipple: true,
    'aria-label': ariaLabel ?? (useIconStyle && typeof label === 'string' ? label : undefined),
    classes: {
      root: cx({
        [railItemIconOnly]: useIconStyle,
        [railItem]: !useIconStyle,
        [railItemVertical]: compact && !useIconStyle,
        [railItemNoHover]: !iconOnlyHover,
        'radius-medium hover:bg-shift-200 active:bg-shift-300': iconOnlyHover && !active,
        'radius-medium bg-shift-200 hover:bg-shift-300 active:bg-shift-300':
          iconOnlyHover && active,
      }),
      startIcon: cx(startIcon, {
        [startIconCompact]: compact && !useIconStyle,
        [startIconTransition]: enableAnimation && !useIconStyle,
        'hover:bg-shift-200 active:bg-shift-300': compact && !useIconStyle && !active,
        'bg-shift-200 hover:bg-shift-300 active:bg-shift-300': compact && !useIconStyle && active,
        'hover:content-emphasis': compact && !useIconStyle,
        'content-emphasis': active && compact && !useIconStyle,
      }),
    },
    color: active ? 'secondary' : 'primary',
    startIcon: startIconEl,
  } as const;

  const buttonContent = (
    <>
      <Typography
        classes={{
          root: cx(labelClass, {
            [labelTransition]: isReady,
            [verticalLabel]: compact && !useIconStyle,
            [labelHidden]: useIconStyle,
          }),
        }}
        variant={textVariant}>
        {label}
      </Typography>
      {!compact && !useIconStyle && adornment && (
        <span className='margin-left-auto flex shrink-0 items-center'>
          {withNavAdornmentSize(adornment)}
        </span>
      )}
    </>
  );

  let buttonEl: React.ReactElement;
  if (href != null && href.startsWith('http')) {
    buttonEl = (
      <Button {...buttonProps} component='a' href={href}>
        {buttonContent}
      </Button>
    );
  } else if (href != null) {
    buttonEl = (
      <Button {...buttonProps} component={Link} href={href} prefetch={false}>
        {buttonContent}
      </Button>
    );
  } else {
    buttonEl = <Button {...buttonProps}>{buttonContent}</Button>;
  }

  return (
    <div
      ref={ref}
      className={cx(railItemWrapper, {
        [railItemBottom]: bottom,
        'hover:bg-shift-200 active:bg-shift-300':
          !iconOnlyHover && (!compact || useIconStyle) && !active,
        'bg-shift-200 hover:bg-shift-300 active:bg-shift-300': active && (!compact || useIconStyle),
        'content-emphasis': !compact || useIconStyle,
      })}>
      <Tooltip
        title={showTooltip ? label : ''}
        disableHoverListener={!showTooltip}
        placement='right'
        TransitionComponent={Grow}
        TransitionProps={{
          timeout: 100,
          style: { transformOrigin: 'left center' },
        }}
        slotProps={{
          tooltip: {
            className: 'text-body-small',
            style: {
              marginLeft: 8,
            },
          },
        }}>
        {buttonEl}
      </Tooltip>
    </div>
  );
});

export default RailItem;
