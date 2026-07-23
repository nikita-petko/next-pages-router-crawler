import { memo } from 'react';
import NextLink from 'next/link';
import { Button, clsx, type TButtonProps } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';

type TitleProps =
  | { titleKey: string; title?: never }
  | { title: React.ReactNode; titleKey?: never };

type SubtitleProps =
  | { subtitleKey?: string; subtitleLink?: string; subtitle?: never }
  | { subtitle?: React.ReactNode; subtitleKey?: never; subtitleLink?: never };

// TODO(jeminpark): add support for multiple actions (primary, secondary, options)
type ActionsProps =
  | { actions?: React.ReactNode; actionProps?: never }
  | { actionProps?: TButtonProps; actions?: never };

type OverrideProps = { className?: string };

type PageTitleProps = TitleProps & SubtitleProps & ActionsProps & OverrideProps;

export const DEFAULT_ACTION_PROPS = {
  className: 'min-width-fit',
  size: 'Medium',
  variant: 'Emphasis',
} as const satisfies Pick<TButtonProps, 'className' | 'size' | 'variant'>;

/**
 * Foundation-based page title to be used under IAM2 layout.
 * Accepts the following:
 *
 * Title
 *   - Translation Key (string)
 *   - Node (React.ReactNode)
 *
 * Subtitle (optional)
 *   - Translation Key + (optional) Link (string)
 *   - Node (React.ReactNode)
 *
 * Action (optional)
 *   - Props (TButtonProps)
 *   - Node (React.ReactNode)
 *
 * @example
 * ```tsx
 * // With translation keys
 * <PageTitle
 *   titleKey='Heading.ManagedPricing'
 *   subtitleKey='Description.ManagedPricing'
 *   subtitleLink='/docs/production/monetization/managed-pricing'
 *   actionProps={{ variant: 'Standard', children: translate('Action.AddItems') }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With React nodes
 * <PageTitle
 *   title={<h1>Managed Pricing</h1>}
 *   subtitle={<span>Take action to optimize your pricing</span>}
 *   action={
 *     <Button variant='Emphasis' size='Medium'>
 *       <NextLink href='/monetization/managed-pricing/add-items'>
 *         Add items
 *       </NextLink>
 *     </Button>
 *   }
 * />
 * ```
 */
function PageTitle({
  title,
  titleKey,
  subtitle,
  subtitleKey,
  subtitleLink,
  actions,
  actionProps,
  className,
}: PageTitleProps) {
  const { translate, translateHTML } = useTranslation();

  const titleNode =
    titleKey !== undefined ? (
      <h1 className='text-heading-large margin-none'>{translate(titleKey)}</h1>
    ) : (
      title
    );

  const subtitleNode =
    subtitleKey !== undefined ? (
      <span className='content-default padding-bottom-xsmall'>
        {translateHTML(
          subtitleKey,
          subtitleLink
            ? [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  content: (chunks: React.ReactNode) => (
                    <NextLink
                      className='content-link no-underline hover:underline hover:cursor-pointer'
                      href={subtitleLink}
                      target='_blank'>
                      {chunks}
                    </NextLink>
                  ),
                },
              ]
            : undefined,
        )}
      </span>
    ) : (
      subtitle
    );

  const actionsNode =
    actionProps !== undefined ? (
      <Button
        {...DEFAULT_ACTION_PROPS}
        {...actionProps}
        className={clsx(DEFAULT_ACTION_PROPS.className, actionProps.className)}
      />
    ) : (
      actions
    );

  const hasSubtitle = !!subtitleNode;
  const hasAction = !!actionsNode;

  return (
    <div
      className={clsx(
        'flex items-center width-full medium:flex-row',
        hasSubtitle ? 'gap-large' : 'gap-xlarge',
        hasAction ? 'justify-between' : 'justify-start',
        className,
      )}>
      <div className='flex flex-col gap-small'>
        {titleNode}
        {subtitleNode}
      </div>
      {actionsNode}
    </div>
  );
}

export default memo(PageTitle);
