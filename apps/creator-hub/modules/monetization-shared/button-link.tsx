import type { AnchorHTMLAttributes, ReactNode } from 'react';
import NextLink, { type LinkProps as NextLinkProps } from 'next/link';
import { Button, type TButtonProps } from '@rbx/foundation-ui';

type LinkNavigationProps = Pick<
  NextLinkProps,
  | 'href'
  | 'replace'
  | 'scroll'
  | 'shallow'
  | 'prefetch'
  | 'onMouseEnter'
  | 'onTouchStart'
  | 'onNavigate'
  | 'locale'
> &
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'onClick' | 'target' | 'rel'>;

type FoundationButtonProps = Omit<
  Extract<TButtonProps, { as?: 'button' }>,
  'as' | 'asChild' | 'children' | keyof LinkNavigationProps
>;

export type ButtonLinkProps = FoundationButtonProps &
  LinkNavigationProps & {
    children: ReactNode;
  };

/**
 * ButtonLink is a link styled as a Foundation Button for Next.js client-side navigation.
 */
export function ButtonLink({
  href,
  replace,
  scroll,
  shallow,
  prefetch,
  onMouseEnter,
  onTouchStart,
  onNavigate,
  locale,
  onClick,
  target,
  rel,
  isDisabled,
  children,
  ...buttonProps
}: ButtonLinkProps) {
  return (
    <Button asChild {...buttonProps} isDisabled={isDisabled}>
      {isDisabled ? (
        // oxlint-disable-next-line jsx-a11y/anchor-is-valid -- intended to disable link navigation. Should disable noHref for this rule.
        <a
          // TODO(@jeminpark): Use NextLink directly once it supports undefined href to disable navigation:
          // https://github.com/vercel/next.js/discussions/38706
          href={undefined}
          target={target}
          rel={rel}>
          {children}
        </a>
      ) : (
        <NextLink
          href={href}
          replace={replace}
          scroll={scroll}
          shallow={shallow}
          prefetch={prefetch}
          onMouseEnter={onMouseEnter}
          onTouchStart={onTouchStart}
          onNavigate={onNavigate}
          locale={locale}
          onClick={onClick}
          target={target}
          rel={rel}>
          {children}
        </NextLink>
      )}
    </Button>
  );
}
