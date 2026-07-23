import React, { FunctionComponent } from 'react';
import AuthenticationStatusMenuItem from '../../topNavigation/components/authenticationStatus/AuthenticationStatusMenuItem';
import AuthenticationStatusV3 from '../../topNavigation/components/authenticationStatus/AuthenticationStatusV3';

export type TMenuItem = {
  label: string;
  href: string;
  onClick?: VoidFunction;
};

type TAuthenticationStatusContainerProps = {
  onLogout?: VoidFunction;
  menuItems?: TMenuItem[];
};

const AuthenticationStatusContainer: FunctionComponent<TAuthenticationStatusContainerProps> = ({
  menuItems,
  onLogout,
}) => {
  const dropDownContent = menuItems?.map(({ href, onClick, label }) => (
    <AuthenticationStatusMenuItem key={href} text={label} onSelect={onClick} href={href} />
  ));

  return <AuthenticationStatusV3 desktopDropdownContent={dropDownContent} onLogout={onLogout} />;
};

export default AuthenticationStatusContainer;
