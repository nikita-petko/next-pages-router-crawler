import React from 'react';
import { MenuItem, PopoverClose } from '@rbx/foundation-ui';

type TAuthenticationStatusMenuItemProps = {
  text: string;
  onSelect?: () => void;
  href?: string;
  disabled?: boolean;
};

const AuthenticationStatusMenuItem = ({
  text,
  onSelect,
  href,
  disabled,
}: TAuthenticationStatusMenuItemProps) => {
  const sharedProps = {
    title: text,
    value: text,
    onSelect,
    disabled,
    className: disabled ? 'pointer-events-none' : undefined,
  };

  return (
    <PopoverClose asChild>
      {href ? <MenuItem as='a' href={href} {...sharedProps} /> : <MenuItem {...sharedProps} />}
    </PopoverClose>
  );
};

export default AuthenticationStatusMenuItem;
