import React, { FC } from 'react';
import { Dialog, IconButton, Typography, CloseIcon } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useEstimateEarningModalStyles from './EstimateEarningModal.styles';
import {
  ModalTitleKey,
  ModalIntroKey,
  ModalLine2Key,
  ModalProjectedEPMKey,
  ModalLine4Key,
} from '../constants/calculatorTranslationKeys';

interface EstimateEarningModalProps {
  open: boolean;
  onClose: () => void;
  estimatedEarnings?: string | number;
  adsPerUser?: number;
}

// Component to wrap the earnings count value
const EarningsValue: FC<{ estimatedEarnings: string | number }> = ({ estimatedEarnings }) => {
  return <React.Fragment>{estimatedEarnings}</React.Fragment>;
};

// Component to wrap the ads per user count value
const AdsPerUserValue: FC<{ adsPerUser: number }> = ({ adsPerUser }) => {
  return <React.Fragment>{adsPerUser.toFixed(1)}</React.Fragment>;
};

const EstimateEarningModal: FC<EstimateEarningModalProps> = ({
  open,
  onClose,
  estimatedEarnings = '[x]',
  adsPerUser = 0,
}) => {
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
