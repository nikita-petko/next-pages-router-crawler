import type { FC } from 'react';
import React from 'react';
import { MenuItem, Typography } from '@rbx/ui';
import { Link } from '@modules/miscellaneous/components';
import useNotificationContentFormStyles from '../styles/notificationContentForm';

type NotificationActionMethod = React.MouseEventHandler<HTMLLIElement>;

type ConditionalLinkWrapperProps = {
  url?: string;
  children: React.ReactElement;
};

export type NotificationContentAction = {
  name?: string;
  label: string;
  url?: string;
  method?: NotificationActionMethod;
};

type NotificationContentActionMenuItem = NotificationContentAction & {
  index: number;
};

const ConditionalLinkWrapper: FC<React.PropsWithChildren<ConditionalLinkWrapperProps>> = ({
  children,
  url,
}) => {
  const {
    classes: { menuItemLink },
  } = useNotificationContentFormStyles();
  if (url) {
    return (
      <Link href={url} display='block' underline='none' color='inherit' className={menuItemLink}>
        {children}
      </Link>
    );
  }

  return children;
};

const NotificationContentActionMenuItem: FC<
  React.PropsWithChildren<NotificationContentActionMenuItem>
> = ({ url, method, label, index, name }) => {
  return (
    <MenuItem
      onClick={method}
      tabIndex={0}
      autoFocus={index === 0}
      data-testid={name}
      disableGutters={!!url}>
      <ConditionalLinkWrapper url={url}>
        <Typography variant='captionHeader' display='block'>
          {label}
        </Typography>
      </ConditionalLinkWrapper>
    </MenuItem>
  );
};

export default NotificationContentActionMenuItem;
