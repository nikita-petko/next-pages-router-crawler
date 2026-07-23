import type { FC } from 'react';
import React, { useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogTemplate,
  Divider,
  Grid,
  InfoOutlinedIcon,
  RobuxIcon,
  Tooltip,
  Typography,
  useTheme,
} from '@rbx/ui';
import { publishingAdvanceLink } from '../constants/LinkConstants';
import useAvatarCreationTokenStyles from './Styles/AvatarCreationTokenStyles.styles';

export type TCreationAdvanceComponentProps = {
  publishingAdvance: number | undefined;
  creationFee: number | undefined;
};

const CreationAdvanceComponent: FC<React.PropsWithChildren<TCreationAdvanceComponentProps>> = ({
  publishingAdvance,
  creationFee,
}) => {
  const {
    classes: { tooltip, labelText },
  } = useAvatarCreationTokenStyles();

  const { translate } = useTranslation();
  const theme = useTheme();

  const [showPublishAdvanceInfoDialog, setShowPublishAdvanceInfoDialog] = useState(false);

  return (
    <Grid>
      <Grid item XSmall={12} alignItems='center' container spacing={2}>
        <Grid item XSmall={12} Large={5} alignItems='center' container>
          <Grid item XSmall={9} Large={7}>
            <Typography variant='h2'>{`${translate('Label.CreationAdvance')}`}</Typography>
            <br />
            <Typography variant='body2' className={labelText}>
              {`${translate('Label.PublishAdvanceInfoShort')}`}
            </Typography>
          </Grid>
          <Grid item XSmall={3} Large={5}>
            <Button
              style={{ marginLeft: '8px' }}
              onClick={() => setShowPublishAdvanceInfoDialog(true)}>
              <InfoOutlinedIcon color='secondary' />
            </Button>
          </Grid>
        </Grid>
        <Grid item XSmall={12} Large={7} alignItems='center' container>
          <RobuxIcon />
          <Typography
            data-testid='creation-advance'
            style={{ fontSize: '18px', fontWeight: '425', margin: '0 8px' }}>
            {publishingAdvance !== undefined ? publishingAdvance.toLocaleString() : ''}
          </Typography>
        </Grid>
        <Dialog open={showPublishAdvanceInfoDialog}>
          <DialogTemplate
            onConfirm={() => setShowPublishAdvanceInfoDialog(false)}
            onCancel={() => {
              window.open(publishingAdvanceLink, '_blank');
              setShowPublishAdvanceInfoDialog(false);
            }}
            title=''
            content={
              <div
                style={{
                  minWidth: '580px',
                  padding: '0 10px 10px 10px',
                  color: theme.palette.mode === 'light' ? 'black' : 'white',
                }}>
                <Typography style={{ fontWeight: '450', fontSize: '20px' }}>
                  {translate('Label.PublishAdvanceInfoDialogTitle')}
                </Typography>
                <Divider style={{ margin: '24px 0' }} />
                <Typography>{translate('Label.PublishAdvanceInfoDialogInfo')}</Typography>
                <br />
                <br />
                <Typography>{translate('Label.PublishAdvanceInfoDialogExample')}</Typography>
                <img
                  src={`${process.env.assetPathPrefix}/unifiedFeeSystem/PublishAdvanceInfoTable.png`}
                  alt='publish-advance-info-table'
                  style={{ maxWidth: '100%', height: 'auto', marginTop: '16px' }}
                />
              </div>
            }
            confirmText={translate('Action.Done')}
            cancelText={translate('Action.LearnMore')}
          />
        </Dialog>
      </Grid>
      <Grid item XSmall={12} alignItems='center' container marginTop={5} spacing={2}>
        <Grid item XSmall={12} Large={5} alignItems='center' container>
          <Typography variant='h2'>{translate('Label.CreationFee')}</Typography>
          <Tooltip
            title={translate('Label.CreationFeeDescription', {
              item: translate('Label.AvatarCreationToken'),
            })}>
            <div style={{ display: 'flex', height: '100%' }}>
              <InfoOutlinedIcon color='secondary' className={tooltip} />
            </div>
          </Tooltip>
        </Grid>
        <Grid item XSmall={8} Large={7} alignItems='stretch' container>
          <RobuxIcon />
          <Typography
            data-testid='creation-fee'
            style={{ fontSize: '18px', fontWeight: '425', margin: '0 8px' }}>
            {creationFee !== undefined ? creationFee.toLocaleString() : ''}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default CreationAdvanceComponent;
