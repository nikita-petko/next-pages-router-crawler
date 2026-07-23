import NextLink, { type LinkProps as NextLinkProps } from 'next/link';
import { Link as FoundationLink, type TLinkProps } from '@rbx/foundation-ui';

export type LinkProps = Omit<Extract<TLinkProps, { as?: 'a' }>, 'as' | 'href'> &
  Pick<
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
  >;

/**
 * Next.js-integrated Foundation Link component for client-side routing.
 *
 * Prefer this over base links from next/link or foundation-ui as this effectively
 * ensures query caching and prefetching is handled correctly across Creator Hub.
 */
export function Link({
  href,
  replace,
  scroll,
  shallow,
  prefetch,
  onMouseEnter,
  onTouchStart,
  onNavigate,
  locale,
  children,
  ...props
}: LinkProps) {
  return (
    <FoundationLink isExternal={props.isExternal ?? false} {...props} asChild>
      <NextLink
        href={href}
        replace={replace}
        scroll={scroll}
        shallow={shallow}
        prefetch={prefetch}
        onMouseEnter={onMouseEnter}
        onTouchStart={onTouchStart}
        onNavigate={onNavigate}
        locale={locale}>
        {children}
      </NextLink>
    </FoundationLink>
  );
}
