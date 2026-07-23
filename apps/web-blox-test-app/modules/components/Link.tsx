import type { LinkProps as TNextLinkProps } from 'next/link';
import NextLink from 'next/link';
import type { FunctionComponent } from 'react';
import React from 'react';
import type { TLinkProps as TUILinkProps } from '@rbx/ui';
import { Link as UILink } from '@rbx/ui';

export type CreatorDashboardLinkProps = TNextLinkProps & Omit<TUILinkProps, 'href'>;

const CreatorDashboardLink: FunctionComponent<
  React.PropsWithChildren<CreatorDashboardLinkProps>
> = (props) => {
  const { onClick, href, ...otherProps } = props;

  // NOTE (@mbae, 06/05/24): Next.js 14 - empty-like values of href are behaving differently.
  // They are translated into '/undefined' instead of just '/'.
  return (
    <NextLink {...(otherProps as TNextLinkProps)} href={href || '/'} passHref legacyBehavior>
      <UILink {...otherProps} onClick={onClick} />
    </NextLink>
  );
};

export default CreatorDashboardLink;
