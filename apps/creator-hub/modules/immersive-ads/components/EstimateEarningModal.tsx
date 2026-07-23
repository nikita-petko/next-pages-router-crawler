import { Fragment } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Dialog, IconButton, Typography, CloseIcon } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  ModalTitleKey,
  ModalIntroKey,
  ModalLine2Key,
  ModalProjectedEPMKey,
  ModalLine4Key,
} from '../constants/calculatorTranslationKeys';
import useEstimateEarningModalStyles from './EstimateEarningModal.styles';

interface EstimateEarningModalProps {
  open: boolean;
  onClose: () => void;
  estimatedEarnings?: string | number;
  adsPerUser?: number;
}

// Component to wrap the earnings count value
const EarningsValue = ({ estimatedEarnings }: { estimatedEarnings: string | number }) => {
  return <>{estimatedEarnings}</>;
};

// Component to wrap the ads per user count value
const AdsPerUserValue = ({ adsPerUser }: { adsPerUser: number }) => {
  return <>{adsPerUser.toFixed(1)}</>;
};

const EstimateEarningModal = ({
  open,
  onClose,
  estimatedEarnings = '[x]',
  adsPerUser = 0,
}: EstimateEarningModalProps) => {
  const { classes } = useEstimateEarningModalStyles();
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        className: classes.dialogPaper,
      }}>
      <div className={classes.wrapper}>
        <div className={classes.utility}>
          <IconButton onClick={onClose} className={classes.closeButton} aria-label='Close'>
            <CloseIcon />
          </IconButton>
        </div>

        <div className={classes.content}>
          <div className={classes.contentInner}>
            <div className={classes.titleContainer}>
              <Typography className={classes.title}>{translate(ModalTitleKey)}</Typography>
            </div>

            <div className={classes.body}>
              <div className={classes.bodyText}>
                <Typography component='span'>
                  {translateHTML(ModalIntroKey, [
                    {
                      opening: 'countStart',
                      closing: 'countEnd',
                      content: () => <EarningsValue estimatedEarnings={estimatedEarnings} />,
                    },
                  ])}
                </Typography>
                <br />
                <br />
                <Typography component='span'>
                  {translateHTML(ModalLine2Key, [
                    {
                      opening: 'adsCountStart',
                      closing: 'adsCountEnd',
                      content: () => <AdsPerUserValue adsPerUser={adsPerUser} />,
                    },
                  ])}
                </Typography>
                <br />
                <br />
                <Typography component='span'> {translate(ModalProjectedEPMKey)}</Typography>
                <br />
                <br />
                <Typography component='span'>{translate(ModalLine4Key)}</Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default withTranslation(EstimateEarningModal, [TranslationNamespace.ImmersiveAdsAnalytics]);
