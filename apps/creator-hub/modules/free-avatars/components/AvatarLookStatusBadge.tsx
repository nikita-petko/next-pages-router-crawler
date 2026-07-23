export type TAvatarLookStatus = 'enabled' | 'moderated' | 'disabled';

export type TAvatarLookStatusLabels = Record<TAvatarLookStatus, string>;

type AvatarLookStatusBadgeProps = {
  status: TAvatarLookStatus;
  labels: TAvatarLookStatusLabels;
};

export function AvatarLookStatusBadge({ status, labels }: AvatarLookStatusBadgeProps) {
  const indicatorClassName =
    status === 'enabled'
      ? 'bg-system-success'
      : status === 'moderated'
        ? 'bg-system-warning'
        : 'bg-system-neutral';

  return (
    <div className='flex height-600 items-center gap-xsmall'>
      <span className={`size-200 radius-circle shrink-0 ${indicatorClassName}`} aria-hidden />
      <span className='text-caption-medium content-emphasis'>{labels[status]}</span>
    </div>
  );
}

export function getPlaceholderAvatarLookStatus(): 'disabled' {
  return 'disabled';
}
