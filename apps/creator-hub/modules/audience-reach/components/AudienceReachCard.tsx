import type { FC, ReactNode } from 'react';
import type { TTailwindIconClass } from '@rbx/foundation-tailwind/classes';
import type { TButtonVariant, TFeedbackBannerSeverity } from '@rbx/foundation-ui';
import { FeedbackBanner, Icon, Button } from '@rbx/foundation-ui';

export interface CardMessage {
  severity: TFeedbackBannerSeverity;
  title: string;
  description?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Stack title above description (multi-line). Default 'Inline'. */
  layout?: 'Inline' | 'Stacked';
}

export interface CardAction {
  label: string;
  onClick: () => void;
  variant?: TButtonVariant;
}

export interface AudienceReachCardProps {
  /** Optional in-card callout banner rendered at the top of the card. */
  message?: CardMessage;
  /**
   * Small header label above the value. Omit for the Overall reach banner-style card
   * which only shows an icon + value.
   */
  title?: string;
  /** Optional leading icon shown next to the value (used by Overall reach). */
  leadingIcon?: TTailwindIconClass;
  /** Primary display value (large bold text). May include inline decorations. */
  value: ReactNode;
  /** Optional description rendered under the value (full width). */
  description?: ReactNode;
  /** Optional primary/standard button rendered on the right of the title+value row. */
  action?: CardAction;
}

const AudienceReachCard: FC<AudienceReachCardProps> = ({
  message,
  title,
  leadingIcon,
  value,
  description,
  action,
}) => (
  <div className='flex flex-col gap-medium padding-large radius-medium stroke-standard stroke-emphasis'>
    {message ? (
      <FeedbackBanner
        title={message.title}
        description={message.description}
        primaryActionLabel={message.action?.label}
        onPrimaryAction={message.action?.onClick}
        layout={message.layout ?? 'Inline'}
        variant='Emphasis'
        severity={message.severity}
      />
    ) : null}
    <div className='flex items-center wrap gap-medium'>
      <div className='flex flex-col gap-xsmall grow-1 shrink-1'>
        {title ? <span className='text-body-medium'>{title}</span> : null}
        <div className='flex items-center gap-small'>
          {leadingIcon ? <Icon name={leadingIcon} size='Large' /> : null}
          <span className='text-title-large'>{value}</span>
        </div>
      </div>
      {action ? (
        <div className='grow-0 shrink-0'>
          <Button variant={action.variant ?? 'Standard'} size='Small' onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      ) : null}
    </div>
    {description ? <div className='text-body-medium'>{description}</div> : null}
  </div>
);

export default AudienceReachCard;
