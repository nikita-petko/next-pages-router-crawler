import { memo } from 'react';
import { Button, clsx, type TButtonProps } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Link } from './link';

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
      // Note(jeminpark): Temporarily adding padding and increasing size from text-body-medium
      // until rest of layout is migrated to standard
      <span className='text-body-large content-default padding-top-xsmall'>
        {translateHTML(
          subtitleKey,
          subtitleLink
            ? [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  content: (chunks: React.ReactNode) => (
                    <Link href={subtitleLink} target='_blank'>
                      {chunks}
                    </Link>
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

  const hasAction = !!actionsNode;

  return (
    <div
      className={clsx(
        'flex items-center gap-xlarge width-full medium:flex-row',
        hasAction ? 'justify-between' : 'justify-start',
        className,
      )}>
      <div className='flex flex-col gap-xsmall'>
        {titleNode}
        {subtitleNode}
      </div>
      {actionsNode}
    </div>
  );
}

export default memo(PageTitle);
