import { memo, useId } from 'react';
import NextLink from 'next/link';
import {
  Button,
  FeedbackBanner,
  type TButtonProps,
  type TFeedbackBannerSeverity,
  type TFeedbackBannerVariant,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';

type ItemTitleProps =
  | { titleKey: string; title?: never }
  | { title: React.ReactNode; titleKey?: never };

type ItemDescriptionProps =
  | { descriptionKey?: string; description?: never }
  | { description?: React.ReactNode; descriptionKey?: never };

type ItemActionProps =
  | { action?: React.ReactNode; actionProps?: never }
  | { actionProps?: TButtonProps; action?: never };

export type MultiFeedbackBannerItem = ItemTitleProps & ItemDescriptionProps & ItemActionProps;

export type MultiFeedbackBannerProps = {
  /** Title of the banner when multiple items are present. */
  title?: string;
  /** Items to display in the banner. */
  items: MultiFeedbackBannerItem[];
  /** Severity of the banner. @see {@link TFeedbackBannerSeverity} */
  severity?: TFeedbackBannerSeverity;
  /** Variant of the banner. @see {@link TFeedbackBannerVariant} */
  variant?: TFeedbackBannerVariant;
  /** Aria label for the dismiss icon. */
  dismissIconAriaLabel?: string;
  /** Callback to handle dismiss. */
  onDismiss?: () => void;
};

/** Helper for rendering a button action. */
function ButtonAction(props: TButtonProps) {
  // Note: we are intentionally overriding and rendering Next.js Links for client-side routing here.
  // TODO(@jeminpark): consider lifting button up to general component to override in Creator Hub
  // eslint-disable-next-line react/destructuring-assignment -- need for discriminated union
  if (props.as === 'a') {
    // Need to destructure this in order to strictly type buttons
    const {
      as: _as,
      href,
      children,
      variant,
      size,
      isDisabled,
      isLoading,
      icon,
      className,
      ...linkRest
    } = props;

    return (
      <Button
        asChild
        size={size ?? 'Small'}
        variant={variant ?? 'Standard'}
        isDisabled={isDisabled}
        isLoading={isLoading}
        icon={icon}
        className={className}>
        <NextLink href={href ?? ''} {...linkRest}>
          {children}
        </NextLink>
      </Button>
    );
  }

  return <Button size='Small' variant='Standard' {...props} />;
}

/** Helper for getting the nodes for a banner item. */
function getBannerItemNodes(
  item: MultiFeedbackBannerItem,
  translate: ReturnType<typeof useTranslation>['translate'],
) {
  const titleNode = item.titleKey !== undefined ? translate(item.titleKey) : item.title;

  const descriptionNode =
    item.descriptionKey !== undefined ? translate(item.descriptionKey) : item.description;

  const actionNode =
    item.actionProps !== undefined ? <ButtonAction {...item.actionProps} /> : item.action;

  return { titleNode, descriptionNode, actionNode } as const;
}

function MultiFeedbackBannerItemRow({ item }: { item: MultiFeedbackBannerItem }) {
  const { translate } = useTranslation();
  const { titleNode, descriptionNode, actionNode } = getBannerItemNodes(item, translate);

  return (
    <div className='flex items-center gap-medium padding-y-medium'>
      <div className='flex flex-col gap-xsmall grow-1 min-width-0 basis-0'>
        <span className='text-label-medium content-emphasis'>{titleNode}</span>
        {descriptionNode != null && (
          <span className='text-body-medium content-default'>{descriptionNode}</span>
        )}
      </div>
      {actionNode != null && <div className='shrink-0'>{actionNode}</div>}
    </div>
  );
}

/**
 * Feedback banner for displaying multiple items. Uses `Stacked` layout by default.
 */
function MultiFeedbackBanner({
  title,
  items,
  severity,
  variant,
  dismissIconAriaLabel,
  onDismiss,
}: MultiFeedbackBannerProps) {
  const { translate } = useTranslation();

  const id = useId();

  if (items.length === 0) {
    return null;
  }

  if (items.length === 1) {
    const { titleNode, descriptionNode, actionNode } = getBannerItemNodes(items[0], translate);

    return (
      <FeedbackBanner
        title={titleNode}
        layout='Stacked'
        severity={severity}
        variant={variant}
        dismissIconAriaLabel={dismissIconAriaLabel ?? translate('Action.Dismiss')}
        onDismiss={onDismiss}
        description={descriptionNode}
        actions={<div className='max-width-max shrink-0'>{actionNode}</div>}
      />
    );
  }

  const bannerTitle =
    title ?? translate('Heading.AlertCountMultiple', { alertCount: items.length.toString() });

  return (
    <FeedbackBanner
      title={bannerTitle}
      layout='Stacked'
      severity={severity}
      variant={variant}
      dismissIconAriaLabel={dismissIconAriaLabel ?? translate('Action.Dismiss')}
      onDismiss={onDismiss}
      description={items.map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key -- using exclusive id, ordering should be stable
        <MultiFeedbackBannerItemRow key={`${id}-item-${index}`} item={item} />
      ))}
    />
  );
}

export default memo(MultiFeedbackBanner);
