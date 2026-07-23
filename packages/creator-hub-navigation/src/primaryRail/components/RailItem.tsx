import React, { useCallback } from 'react';
import Router from 'next/router';
import { Button, Typography } from '@rbx/ui';
import useRailStyles from './Rail.styles';

type TRailItemProps = {
  icon: React.ReactNode;
  active?: boolean;
  activeIcon?: React.ReactNode;
  label?: React.ReactNode;
  adornment?: React.ReactNode;
  bottom?: boolean;
  compact?: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  href?: string;
  enableAnimation?: boolean;
};

const RailItem: React.FC<TRailItemProps> = ({
  onClick,
  icon,
  active = false,
  activeIcon,
  label,
  adornment,
  compact = false,
  bottom = false,
  enableAnimation = false,
  href,
}) => {
  const {
    cx,
    classes: {
      railItem,
      railItemVertical,
      railItemBottom,
      railItemWrapper,
      railItemNoHover,
      railItemTransition,
      startIcon,
      startIconCompact,
      startIconTransition,
      verticalLabel,
      labelTransition,
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
        const isAbsoluteUrl = href.startsWith('http');
        if (isAbsoluteUrl) {
          window.open(href, '_self');
        } else {
          void Router.push(href);
        }
      }, 100);
    },
    [href, onClick],
  );

  const textVariant = compact ? 'captionSmall' : 'largeLabel2';
  const startIconEl = active && activeIcon ? activeIcon : icon;

  return (
    <div
      className={cx(railItemWrapper, {
        [railItemBottom]: bottom,
        'hover:bg-shift-300': !compact,
        'hover:content-emphasis': !compact,
        'bg-shift-300': active && !compact,
        'content-emphasis': active && !compact,
      })}>
      <Button
        href={href}
        onClick={onClickWrapper}
        variant='text'
        disableRipple
        classes={{
          root: cx(railItem, {
            [railItemVertical]: compact,
            [railItemNoHover]: !compact,
            [railItemTransition]: enableAnimation,
          }),
          startIcon: cx(startIcon, {
            [startIconCompact]: compact,
            [startIconTransition]: enableAnimation,
            'hover:bg-shift-300': compact,
            'hover:content-emphasis': compact,
            'bg-shift-300': active && compact,
            'content-emphasis': active && compact,
          }),
        }}
        color={active ? 'secondary' : 'primary'}
        startIcon={startIconEl}>
        <Typography
          classes={{
            root: cx(labelClass, {
              [labelTransition]: enableAnimation,
              [verticalLabel]: compact,
            }),
          }}
          variant={textVariant}>
          {label}
        </Typography>
        {!compact && adornment && <span className='margin-left-[8px]'>{adornment}</span>}
      </Button>
    </div>
  );
};

export default RailItem;
