import type { FunctionComponent } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Link, Typography, makeStyles } from '@rbx/ui';
import { Body, Flex } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { docs } from '@modules/miscellaneous/urls/creatorHub';

const useStyles = makeStyles()({
  description: {
    marginBottom: 14,
  },
});

const DataSharingTitle: FunctionComponent = () => {
  const {
    classes: { description },
  } = useStyles();
  const { translate } = useTranslation();
  return (
    <Flex classes={{ root: description }} flexDirection='column'>
      <Body>
        <Typography component='p' marginBottom={2}>
          <span>
            {translate('Description.DataSharing1')}
            &nbsp;
          </span>
          <Link href={docs.getAiDataSharingUrl()}>{translate('Action.LearnMore')}</Link>
        </Typography>
        <Typography component='p'>{translate('Description.DataSharing2')}</Typography>
      </Body>
    </Flex>
  );
};

export default withTranslation(DataSharingTitle, [TranslationNamespace.DataSharingSettingsV2]);
