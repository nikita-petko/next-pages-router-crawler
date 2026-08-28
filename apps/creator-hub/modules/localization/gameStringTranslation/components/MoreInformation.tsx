import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography, Grid } from '@rbx/ui';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import Panel from '../../common/components/Panel';
import SharedMoreInformation from '../../translation/components/shared/MoreInformation';
import useMoreInformationStyles from './MoreInformation.styles';

export interface MoreInformationProps {
  translationContext: string | null;
  translationExample: string | null;
  translationKey: string | null;
  translationLocation: string | null;
}

const LegacyMoreInformation: FunctionComponent<React.PropsWithChildren<MoreInformationProps>> = ({
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
          {/*oxlint-disable-next-line typescript/prefer-nullish-coalescing -- intentional boolean OR: falsy (incl. empty string) falls back to the default message*/}
          {translationContext || translate('Message.DefaultContext')}
        </Typography>
      </Grid>
      <Grid className={margins}>
        <Typography display='inline' className={title} variant='largeLabel1'>
          {translate('Label.Example')}:
        </Typography>
        <Typography display='inline' className={text} variant='largeLabel2'>
          {/*oxlint-disable-next-line typescript/prefer-nullish-coalescing -- intentional boolean OR: falsy (incl. empty string) falls back to the default message*/}
          {translationExample || translate('Message.DefaultExample')}
        </Typography>
      </Grid>
      <Grid className={margins}>
        <Typography display='inline' className={title} variant='largeLabel1'>
          {translate('Label.Key')}:
        </Typography>
        <Typography display='inline' className={text} variant='largeLabel2'>
          {/*oxlint-disable-next-line typescript/prefer-nullish-coalescing -- intentional boolean OR: falsy (incl. empty string) falls back to the default message*/}
          {translationKey || translate('Message.DefaultKey')}
        </Typography>
      </Grid>
      <Grid className={margins}>
        <Typography display='inline' className={title} variant='largeLabel1'>
          {translate('Label.Location')}:
        </Typography>
        <Typography display='inline' className={text} variant='largeLabel2'>
          {/*oxlint-disable-next-line typescript/prefer-nullish-coalescing -- intentional boolean OR: falsy (incl. empty string) falls back to the default message*/}
          {translationLocation || translate('Message.DefaultLocation')}
        </Typography>
      </Grid>
    </Panel>
  );
};

// Gated by the `enableSharedTranslationListComponents` client setting: renders the shared,
// generic MoreInformation (fed pre-resolved labels/values) when on, otherwise the original
// local implementation.
const MoreInformation: FunctionComponent<React.PropsWithChildren<MoreInformationProps>> = ({
  translationContext,
  translationExample,
  translationKey,
  translationLocation,
}) => {
  const { settings } = useSettings();

  if (settings.enableSharedTranslationListComponents) {
    return (
      <SharedMoreInformation
        translationContext={translationContext}
        translationExample={translationExample}
        translationKey={translationKey}
        translationLocation={translationLocation}
      />
    );
  }

  return (
    <LegacyMoreInformation
      translationContext={translationContext}
      translationExample={translationExample}
      translationKey={translationKey}
      translationLocation={translationLocation}
    />
  );
};

export default MoreInformation;
