import React, { FunctionComponent } from 'react';
import { Typography, Grid } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import Panel from '../../common/components/Panel';
import useMoreInformationStyles from './MoreInformation.styles';

export interface MoreInformationProps {
  translationContext: string | null;
  translationExample: string | null;
  translationKey: string | null;
  translationLocation: string | null;
}

const MoreInformation: FunctionComponent<React.PropsWithChildren<MoreInformationProps>> = ({
  translationContext,
  translationExample,
  translationKey,
  translationLocation,
}) => {
  const {
    classes: { container, title, margins, text },
  } = useMoreInformationStyles();
  const { translate } = useTranslation();

  return (
    <Panel className={container} title={translate('Title.MoreInformation')}>
      <Grid className={margins}>
        <Typography className={title} display='inline' variant='largeLabel1'>
          {translate('Label.Context')}:
        </Typography>
        <Typography className={text} display='inline' variant='largeLabel2'>
          {translationContext || translate('Message.DefaultContext')}
        </Typography>
      </Grid>
      <Grid className={margins}>
        <Typography display='inline' className={title} variant='largeLabel1'>
          {translate('Label.Example')}:
        </Typography>
        <Typography display='inline' className={text} variant='largeLabel2'>
          {translationExample || translate('Message.DefaultExample')}
        </Typography>
      </Grid>
      <Grid className={margins}>
        <Typography display='inline' className={title} variant='largeLabel1'>
          {translate('Label.Key')}:
        </Typography>
        <Typography display='inline' className={text} variant='largeLabel2'>
          {translationKey || translate('Message.DefaultKey')}
        </Typography>
      </Grid>
      <Grid className={margins}>
        <Typography display='inline' className={title} variant='largeLabel1'>
          {translate('Label.Location')}:
        </Typography>
        <Typography display='inline' className={text} variant='largeLabel2'>
          {translationLocation || translate('Message.DefaultLocation')}
        </Typography>
      </Grid>
    </Panel>
  );
};

export default MoreInformation;
