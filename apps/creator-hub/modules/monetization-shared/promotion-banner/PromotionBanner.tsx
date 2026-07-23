import { IconButton, clsx } from '@rbx/foundation-ui';

export type PromotionBannerProps = {
  /** Banner heading. */
  title: React.ReactNode;
  /** Optional supporting copy. */
  description?: React.ReactNode;
  /** Primary CTA. Caller-rendered so each consumer controls variant/size/href/onClick. */
  primary: React.ReactNode;
  /** Optional secondary CTA. Caller-rendered. */
  secondary?: React.ReactNode;
  /** Optional illustration on the right side. */
  illustration?: { src: string };
  /** When provided, renders a close `IconButton` in the top-right that fires this callback. */
  onClose?: () => void;
  /** Aria-label for the internal close icon. Defaults to `"close"`. */
  closeLabel?: string;
  /** Class name applied to the root element. */
  className?: string;
  /** Ref to the root element. */
  ref?: React.Ref<HTMLDivElement>;
};

function PromotionBanner({
  title,
  description,
  primary,
  secondary,
  illustration,
  onClose,
  closeLabel = 'close',
  className,
  ref,
}: PromotionBannerProps) {
  return (
    <div
      ref={ref}
      className={clsx(
        'relative flex bg-surface-200 clip radius-large width-full [container-type:inline-size]',
        className,
      )}>
      <div
        className={clsx(
          'flex flex-col gap-xlarge medium:gap-xxlarge grow-1 min-width-0',
          'padding-y-[32px] padding-left-[32px]',
          illustration
            ? 'padding-right-medium [@container(min-width:900px)]:padding-right-[max(22%,300px)]'
            : 'padding-right-none [@container(min-width:900px)]:padding-right-[32px]',
        )}>
        <div className='flex flex-col gap-small medium:gap-xsmall'>
          <h2 className='content-emphasis margin-none text-heading-small medium:text-heading-medium'>
            {title}
          </h2>
          {description && (
            <span className='content-emphasis text-body-medium medium:text-body-large'>
              {description}
            </span>
          )}
        </div>

        <div className='flex flex-col small:flex-row gap-medium'>
          {primary}
          {secondary}
        </div>
      </div>

      {illustration && (
        <img
          src={illustration.src}
          alt=''
          aria-hidden='true'
          className='hidden [@container(min-width:900px)]:block absolute top-[0] right-[0] bottom-[0] height-full max-width-[50%] pointer-events-none'
        />
      )}

      {onClose && (
        <IconButton
          className='absolute top-[16px] right-[16px] shrink-0 max-width-800 max-height-800'
          variant='Utility'
          size='Large'
          icon='icon-filled-x'
          ariaLabel={closeLabel}
          onClick={onClose}
        />
      )}
    </div>
  );
}

PromotionBanner.displayName = 'PromotionBanner';

export default PromotionBanner;
