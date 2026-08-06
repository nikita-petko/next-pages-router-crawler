import React, { useCallback } from 'react';
import Router from 'next/router';
import { Button, Grow, Tooltip, Typography } from '@rbx/ui';
import { useRailContext } from '../../layout/providers/RailProvider';
import withNavAdornmentSize from '../../utils/withNavAdornmentSize';
import useRailStyles from './Rail.styles';

const LOCALE_SLUG_REGEXP = /^[a-z]{2}-[a-z]{2}$/i;

/** Navigate like other Creator Hub / docs links (absolute → hard nav; locale home → [locale] route). */
function navigateHref(href: string): void {
  if (href.startsWith('http')) {
    window.open(href, '_self');
    return;
  }

  const path = href.split('?')[0] ?? href;
  const segments = path.split('/').filter(Boolean);

  // Doc-site locale landing (`/en-us` or `/en-us/`) uses pages/[locale], not the catch-all.
  // Plain Router.push('/en-us/') no-ops there; next/link uses this URL object instead.
  if (segments.length === 1 && LOCALE_SLUG_REGEXP.test(segments[0])) {
    void Router.push({
      pathname: '/[locale]',
      query: { locale: segments[0].toLowerCase() },
    });
    return;
  }

  void Router.push(href);
}

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
      e.preventDefault();
      onClick(e);

      if (!href) {
        return;
      }

      setTimeout(() => {
        navigateHref(href);
      }, 100);
    },
    [href, onClick],
  );

  const startIconEl = active && activeIcon ? activeIcon : icon;
  const textVariant = compact && !useIconStyle ? 'captionSmall' : 'largeLabel2';

  const buttonEl = (
    <Button
      href={href}
      onClick={onClickWrapper}
      variant='text'
      disableRipple
      aria-label={ariaLabel ?? (useIconStyle && typeof label === 'string' ? label : undefined)}
      classes={{
        root: cx({
          [railItemIconOnly]: useIconStyle,
          [railItem]: !useIconStyle,
          [railItemVertical]: compact && !useIconStyle,
          [railItemNoHover]: !iconOnlyHover,
          // Hover: shift-200. Pressed: shift-300. Active page: shift-200; +hover/press: shift-300.
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
      }}
      color={active ? 'secondary' : 'primary'}
      startIcon={startIconEl}>
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
    </Button>
  );

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
