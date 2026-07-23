import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';

type DevExInterventionDetailsCardProps = {
  violationReason?: string;
  formattedEndDate?: string;
  countdownText?: string;
};

type DetailFieldProps = {
  label: string;
  value: string;
};

const DetailField: FunctionComponent<DetailFieldProps> = ({ label, value }) => (
  <div className='flex flex-col gap-xxsmall'>
    <span className='text-title-medium content-emphasis margin-none'>{label}:</span>
    <p className='text-body-medium content-default margin-none'>{value}</p>
  </div>
);

const CountdownBadge: FunctionComponent<{ label: string }> = ({ label }) => (
  <span className='text-caption-medium content-default padding-x-small padding-y-xxsmall radius-circle bg-shift-200 [white-space:nowrap]'>
    {label}
  </span>
);

const DevExInterventionDetailsCard: FunctionComponent<DevExInterventionDetailsCardProps> = ({
  violationReason,
  formattedEndDate,
  countdownText,
}) => {
  const { translate } = useTranslation();

  if (!violationReason && !formattedEndDate) {
    return null;
  }

  const reasonLabel = translate('Label.Reason');
  const endsOnLabel = translate('Label.EndsOn');
  const badgeText = countdownText ?? translate('Label.Complete');

  return (
    <div
      data-testid='devex-intervention-details-card'
      className='flex flex-col gap-large padding-y-large padding-x-medium radius-large stroke-default stroke-standard bg-shift-100'>
      {violationReason ? <DetailField label={reasonLabel} value={violationReason} /> : null}

      {formattedEndDate ? (
        <div className='flex flex-row justify-between items-center gap-medium'>
          <DetailField label={endsOnLabel} value={formattedEndDate} />
          <CountdownBadge label={badgeText} />
        </div>
      ) : null}
    </div>
  );
};

export default DevExInterventionDetailsCard;
