import React from 'react';
import { useTranslation } from '@rbx/intl';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';

interface DisplayTemplateProps {
  title: string;
  body: string;
  translateBody?: boolean;
}

const DisplayTemplate: React.FC<DisplayTemplateProps> = ({ title, body, translateBody = true }) => {
  const { translate } = useTranslation();

  return (
    <div className='flex flex-col gap-y-medium'>
      <span className='text-label-medium'>{translate(title)}</span>
      <span className='text-body-medium content-muted margin-none'>
        {translateBody ? translate(body) : body}
      </span>
    </div>
  );
};

interface RevenueShareRateDisplayProps {
  rate?: number;
}

export const RevenueShareRateDisplay: React.FC<RevenueShareRateDisplayProps> = ({ rate }) => {
  if (!rate) {
    return null;
  }

  return (
    <DisplayTemplate
      title='Label.RevenueShareRate'
      body={formatRoyaltyRate(rate)}
      translateBody={false}
    />
  );
};

export interface IphAcceptRequestContextProps {
  showRevShareDisclaimer: boolean;
  rate?: number;
  creatorNote?: string;
  dateRangeString?: string;
}

const IphAcceptRequestContent: React.FC<IphAcceptRequestContextProps> = ({
  showRevShareDisclaimer,
  rate,
  creatorNote,
  dateRangeString,
}) => {
  const { translate } = useTranslation();

  const hasCreatorNote = Boolean(creatorNote);
  const showDateRange = typeof dateRangeString === 'string' && dateRangeString !== '';

  return (
    <div className='flex flex-col gap-medium'>
      {hasCreatorNote && creatorNote ? (
        <div className='flex flex-col gap-y-xsmall'>
          <span className='text-label-medium'>{translate('Label.NoteFromTheCreator')}</span>
          <span
            className='text-body-medium content-muted margin-none'
            style={{ whiteSpace: 'pre-wrap' }}>
            {creatorNote}
          </span>
        </div>
      ) : null}

      {showDateRange ? (
        <DisplayTemplate
          title='Header.AgreementDuration'
          body={translate('Description.AgreementDuration', { dateRange: dateRangeString })}
          translateBody={false}
        />
      ) : null}

      {showRevShareDisclaimer ? (
        <DisplayTemplate title='Label.Disclaimer' body='Message.RevShareTimingDisclaimer' />
      ) : null}

      {typeof rate === 'number' && rate ? <RevenueShareRateDisplay rate={rate} /> : null}

      <DisplayTemplate title='Label.ChangeRequests' body='Description.FutureChangeRequests' />
    </div>
  );
};

export default IphAcceptRequestContent;
