// Announces revenue share information and validation errors with accessible status semantics.
import { forwardRef, type ReactNode } from 'react';
import { FeedbackBanner, type TFeedbackBannerSeverity } from '@rbx/foundation-ui';

type RevShareBannerTone = 'alert' | 'emphasis' | 'warning' | 'success';

const TONE_TO_SEVERITY: Record<RevShareBannerTone, TFeedbackBannerSeverity> = {
  alert: 'Error',
  emphasis: 'Info',
  warning: 'Info',
  success: 'Info',
};

type RevShareBannerActionProps =
  | {
      actionLabel: string;
      onAction: () => void;
    }
  | {
      actionLabel?: never;
      onAction?: never;
    };

type RevShareBannerProps = RevShareBannerActionProps & {
  message: string;
  description?: string;
  tone?: RevShareBannerTone;
  id?: string;
  tabIndex?: number;
  action?: ReactNode;
};

const RevShareBanner = forwardRef<HTMLDivElement, RevShareBannerProps>(
  (
    { message, description, tone = 'emphasis', id, tabIndex, actionLabel, onAction, action },
    ref,
  ) => {
    const actions =
      action !== undefined ? <div className='max-width-max shrink-0'>{action}</div> : undefined;

    return (
      <FeedbackBanner
        ref={ref}
        id={id}
        tabIndex={tabIndex}
        layout='Inline'
        title={message}
        description={description}
        severity={TONE_TO_SEVERITY[tone]}
        variant='Standard'
        actions={actions}
        primaryActionLabel={action === undefined ? actionLabel : undefined}
        onPrimaryAction={action === undefined ? onAction : undefined}
      />
    );
  },
);
RevShareBanner.displayName = 'RevShareBanner';

export default RevShareBanner;
