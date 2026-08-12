import { memo } from 'react';
import { Button, clsx, type TButtonProps } from '@rbx/foundation-ui';
import { type TTranslationKey, type TTranslationNamespace, useTranslation } from '@rbx/intl';
import { Link } from './link';

type TitleProps<Namespace extends TTranslationNamespace> =
  | {
      titleKey: TTranslationKey<NoInfer<Namespace>>;
      titleNamespace: Namespace;
      title?: never;
    }
  | {
      title: React.ReactNode;
      titleNamespace?: never;
      titleKey?: never;
    };

type SubtitleProps<Namespace extends TTranslationNamespace> =
  | {
      subtitleKey: TTranslationKey<NoInfer<Namespace>>;
      subtitleNamespace: Namespace;
      subtitleLink?: string;
      subtitle?: never;
    }
  | {
      subtitle?: React.ReactNode;
      subtitleNamespace?: never;
      subtitleKey?: never;
      subtitleLink?: never;
    };

// TODO(jeminpark): add support for multiple actions (primary, secondary, options)
type ActionsProps =
  | { actions?: React.ReactNode; actionProps?: never }
  | { actionProps?: TButtonProps; actions?: never };

type OverrideProps = { className?: string };

type PageTitleProps<
  TitleNamespace extends TTranslationNamespace,
  SubtitleNamespace extends TTranslationNamespace,
> = TitleProps<TitleNamespace> & SubtitleProps<SubtitleNamespace> & ActionsProps & OverrideProps;

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
 *   - Translation namespace and key
 *   - Node (React.ReactNode)
 *
 * Subtitle (optional)
 *   - Translation namespace and key + (optional) Link (string)
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
 *   titleNamespace='CreatorDashboard.Creations'
 *   subtitleKey='Description.ManagedPricingSubtitleWithLearnMore'
 *   subtitleNamespace='CreatorDashboard.Creations'
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
 *   actions={
 *     <Button variant='Emphasis' size='Medium'>
 *       <NextLink href='/monetization/managed-pricing/add-items'>
 *         Add items
 *       </NextLink>
 *     </Button>
 *   }
 * />
 * ```
 */
function PageTitle<
  TitleNamespace extends TTranslationNamespace,
  SubtitleNamespace extends TTranslationNamespace,
>({
  title,
  titleKey,
  titleNamespace,
  subtitle,
  subtitleKey,
  subtitleNamespace,
  subtitleLink,
  actions,
  actionProps,
  className,
}: PageTitleProps<TitleNamespace, SubtitleNamespace>): React.ReactNode {
  const { translateWithNamespace, translateWithNamespaceHTML } = useTranslation();

  const titleNode =
    titleKey !== undefined && titleNamespace !== undefined ? (
      <h1 className='text-heading-large margin-none'>
        {translateWithNamespace<TitleNamespace>(titleNamespace, titleKey)}
      </h1>
    ) : (
      title
    );

  const subtitleNode =
    subtitleKey !== undefined && subtitleNamespace !== undefined ? (
      // Note(jeminpark): Temporarily adding padding and increasing size from text-body-medium
      // until rest of layout is migrated to standard
      <span className='text-body-large content-default padding-top-xsmall'>
        {translateWithNamespaceHTML<SubtitleNamespace>(
          subtitleNamespace,
          subtitleKey,
          subtitleLink
            ? [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  content: (chunks: React.ReactNode) => (
                    <Link href={subtitleLink} target='_blank' underline='always' color='Standard'>
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
