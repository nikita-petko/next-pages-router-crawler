import { useCallback } from 'react';
import type { TCheckboxCheckState } from '@rbx/foundation-ui';
import { Checkbox } from '@rbx/foundation-ui';
import { Skeleton } from '@rbx/ui';
import { useTalentSignal } from '../../hooks/useTalentSignal';
import styles from '../shared/Layout.module.css';

export type TalentSignalComponentProps = {
  variant: 'self' | 'application' | 'form';
  onOptInChange: null | ((isOptedIn: boolean) => void);
  applicationId: null | string;
  isOptedIn: boolean;
};

type ViewModeVariant = 'showNothing' | 'showError' | 'showNoData' | 'showTalentSignal';

const deconstructMinutes = (minutes: number): { minutes: number; hours: number; days: number } => {
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  return {
    minutes: minutes % 60,
    hours: hours % 24,
    days,
  };
};

const formatTimespent = (timespentMinutes: number) => {
  const { hours, days } = deconstructMinutes(timespentMinutes);
  const parts = [];
  if (days) {
    parts.push(`${days} day${days === 1 ? '' : 's'}`);
  }
  if (hours) {
    parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  }
  return parts.length > 0 ? parts.join(', ') : '0 hours';
};

const TalentSignalStatisticCard = ({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: string | undefined;
  isLoading: boolean;
}) => {
  return isLoading || value ? (
    <div className='bg-surface-200 min-width-0 padding-large gap-medium radius-medium flex flex-col grow-1 basis-0 max-[400px]:width-full max-[400px]:grow-0 max-[400px]:shrink-0'>
      <div className='content-muted text-label-small'>{label}</div>
      {isLoading ? (
        <Skeleton animate variant='text' width={150} height={16} />
      ) : (
        <div className='content-default text-title-large'>{value}</div>
      )}
    </div>
  ) : null;
};

const TalentSignalComponent = ({
  variant,
  applicationId,
  onOptInChange,
  isOptedIn,
}: TalentSignalComponentProps) => {
  const query = useTalentSignal(variant === 'form' ? 'self' : variant, applicationId);
  const onCheckedChange = useCallback(
    (isChecked: TCheckboxCheckState) => {
      if (!onOptInChange || isChecked === 'indeterminate') {
        return;
      }
      onOptInChange(isChecked);
    },
    [onOptInChange],
  );

  let viewMode: ViewModeVariant;
  if (variant === 'form' && !isOptedIn) {
    viewMode = 'showNothing';
  } else if (query.isError) {
    viewMode = 'showError';
  } else if (!query.data && !query.isLoading) {
    viewMode = 'showNoData';
  } else {
    viewMode = 'showTalentSignal';
  }

  return (
    <div className='flex flex-col'>
      <div className={styles.sectionHeader}>
        <span className='text-title-large'>Roblox Studio Activity</span>
      </div>
      {variant === 'form' && (
        <div className='margin-bottom-small'>
          <div className='content-muted text-body-small padding-bottom-xsmall'>
            Sharing your statistics helps employers better understand your creation experience at
            Roblox.
          </div>
          {onOptInChange !== null && (
            <div className={styles.signalOptInCheckbox}>
              <Checkbox
                size='Medium'
                placement='Start'
                isChecked={isOptedIn}
                onCheckedChange={onCheckedChange}
                label='Include these statistics in my application'
              />
            </div>
          )}
        </div>
      )}
      {viewMode === 'showError' && <p>Error fetching Roblox Studio Activity</p>}
      {viewMode === 'showNoData' && <p>No Studio Activity Found</p>}
      {viewMode === 'showTalentSignal' && (
        <div className='min-width-0 padding-bottom-medium gap-large flex flex-col'>
          <div className='flex-wrap min-width-0 width-full gap-large flex max-[400px]:flex-col'>
            <TalentSignalStatisticCard
              label='Studio start date'
              value={query.data?.studioStartDate?.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
              isLoading={query.isLoading}
            />
            <TalentSignalStatisticCard
              label='Studio lifetime usage'
              value={formatTimespent(query.data?.studioTimespentMinutes ?? 0)}
              isLoading={query.isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export type TalentSignalProps = {
  applicationId?: string | null | undefined;
  onOptInChange?: (isOptedIn: boolean) => void;
  isOptedIn?: boolean;
};

/**
 * For DX, allows omitting the applicationId / variant
 *   <TalentSignal /> --> show self talent signal
 *   <TalentSignal applicationId="foo" /> -> show applicant talent signal
 *   <TalentSignal onOptInChange={() => {}} /> -> show self talent signal with opt in change handler
 * Variant is explicit for loading state (ie, applicationId={undefined} is possible)
 */
export const TalentSignal = (props: TalentSignalProps) => {
  const { applicationId: applicationIdRaw, onOptInChange, isOptedIn = true } = props;
  if (Object.hasOwn(props, 'applicationId')) {
    // Note: the `==` is intentional; converts `undefined` and `null` to `null`.
    const applicationId = applicationIdRaw == null ? null : applicationIdRaw;
    return (
      <TalentSignalComponent
        variant='application'
        applicationId={applicationId}
        onOptInChange={null}
        isOptedIn
      />
    );
  }
  if (Object.hasOwn(props, 'onOptInChange') && onOptInChange !== undefined) {
    return (
      <TalentSignalComponent
        variant='form'
        applicationId={null}
        onOptInChange={onOptInChange}
        isOptedIn={isOptedIn}
      />
    );
  }
  return (
    <TalentSignalComponent variant='self' applicationId={null} onOptInChange={null} isOptedIn />
  );
};
