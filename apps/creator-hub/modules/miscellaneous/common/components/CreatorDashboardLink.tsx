import React, { FunctionComponent } from 'react';
import NextLink, { LinkProps as TNextLinkProps } from 'next/link';
import { Link as UILink, TLinkProps as TUILinkProps } from '@rbx/ui';

export type CreatorDashboardLinkProps = TNextLinkProps & Omit<TUILinkProps, 'href'>;

const CreatorDashboardLink: FunctionComponent<
  React.PropsWithChildren<CreatorDashboardLinkProps>
> = (props) => {
  const { onClick, href, ...otherProps } = props;

  // NOTE (@mbae, 06/05/24): Next.js 14 - empty-like values of href are behaving differently.
  // They are translated into '/undefined' instead of just '/'.
  return (
    <NextLink {...otherProps} href={href || '/'} passHref legacyBehavior>
      <UILink {...otherProps} onClick={onClick} />
    </NextLink>
  );
};

export default CreatorDashboardLink;
