import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, Button } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import LinkType from '../enums/LinkType';
import useUnauthorizedViewStyles from '../hooks/useUnauthorizedViewStyles';
import { LearnMoreMessage } from './ExperienceSubscriptionFormMessages';

type Props = {
  showButton: boolean;
};

function ExperienceSubscriptionUnauthorizedView({ showButton }: Props) {
  const { translate } = useTranslation();
  const {
    classes: { failurePageContainer, textContainer },
  } = useUnauthorizedViewStyles();
  const router = useRouter();

  const onReload = () => router.back();

  return (
    <Grid
      container
      direction='column'
      justifyContent='center'
      alignItems='center'
      className={failurePageContainer}>
      <div className={textContainer}>
        <Typography variant='body1'>
          {translate('Message.Unauthorized')}
          <br />
          <br />
        </Typography>

        <Typography variant='body1'>
          {translate('Message.IdOrPhoneVerification')}
          <br />
        </Typography>
        <LearnMoreMessage
          message='Message.ExperienceCreationCriteria'
          type={LinkType.Authorization}
          variant='body1'
        />
      </div>
      {onReload && showButton && (
        <Button variant='contained' color='primaryBrand' onClick={onReload}>
          {translate('Action.BackToCreations')}
        </Button>
      )}
    </Grid>
  );
}

export default withTranslation(ExperienceSubscriptionUnauthorizedView, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.ExperienceSubscriptions,
  TranslationNamespace.Error,
]);
