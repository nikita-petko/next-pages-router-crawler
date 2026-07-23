import React from 'react';
import { CircularProgress, DialogContent, DialogContentText, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';
import { useSettings } from '@modules/settings';

interface DisplayTemplateProps {
  title: string;
  body: string;
  translateBody?: boolean;
}

const DisplayTemplate: React.FC<DisplayTemplateProps> = ({ title, body, translateBody = true }) => {
  const { translate } = useTranslation();

  return (
    <DialogContent>
      <DialogContentText>
        <Typography variant='h6' color='primary'>
          {translate(title)}
        </Typography>
      </DialogContentText>
      <DialogContentText>{translateBody ? translate(body) : body}</DialogContentText>
    </DialogContent>
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

interface DefaultDisplayProps {
  creatorNote?: string;
  dateRange?: string;
}

export const DefaultDisplay: React.FC<DefaultDisplayProps> = ({ creatorNote, dateRange }) => {
  const { translate } = useTranslation();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

  if (!isFetched) {
    return <CircularProgress />;
  }

  return (
    <div>
      {creatorNote && (
        <DialogContent>
          <DialogContentText>
            <Typography variant='h6' color='primary'>
              {translate('Label.NoteFromTheCreator')}
            </Typography>
          </DialogContentText>
          <DialogContentText whiteSpace='pre-wrap'>{creatorNote}</DialogContentText>
        </DialogContent>
      )}

      {enableIpPlatformTimeboundLicenses && dateRange && (
        <DisplayTemplate
          title='Header.AgreementDuration'
          body={translate('Description.AgreementDuration', { dateRange })}
          translateBody={false}
        />
      )}
    </div>
  );
};

export interface IphAcceptRequestContextProps {
  showDisclaimer: boolean;
  rate?: number;
  creatorNote?: string;
  dateRangeString?: string;
}

const IphAcceptRequestContent: React.FC<IphAcceptRequestContextProps> = ({
  showDisclaimer,
  rate = undefined,
  creatorNote,
  dateRangeString,
}) => {
  return (
    <React.Fragment>
      <DefaultDisplay creatorNote={creatorNote} dateRange={dateRangeString} />
      {showDisclaimer && (
        <DisplayTemplate title='Label.Disclaimer' body='Message.RevShareTimingDisclaimer' />
      )}
      {typeof rate === 'number' && <RevenueShareRateDisplay rate={rate} />}
      <DisplayTemplate title='Label.ChangeRequests' body='Description.FutureChangeRequests' />
    </React.Fragment>
  );
};

export default IphAcceptRequestContent;
