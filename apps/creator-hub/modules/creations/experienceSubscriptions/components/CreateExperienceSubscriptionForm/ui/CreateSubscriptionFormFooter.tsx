import { Grid, Divider, Button, useMediaQuery } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import ExperienceSubscriptionFormErrorText from '../../ExperienceSubscriptionFormErrorText';

type TCreateSubscriptionFormFooterProps = {
  buttonContainerStyle: string;
  createButton: string;
  errorMessageStyle: string;
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
  subscriptionErrorMsg: string;
  subscriptionBackendErrorMessage: string;
  onCancel: () => void;
  onCreateClick: () => void;
  communityStandardsLink: (chunks: React.ReactNode) => React.ReactNode;
  isFiatBlockedByVerification?: boolean;
};

function CreateSubscriptionFormFooter({
  buttonContainerStyle,
  createButton,
  errorMessageStyle,
  isSubmitting,
  isValidating,
  isValid,
  subscriptionErrorMsg,
  subscriptionBackendErrorMessage,
  onCancel,
  onCreateClick,
  communityStandardsLink,
  isFiatBlockedByVerification = false,
}: TCreateSubscriptionFormFooterProps) {
  const { translate } = useTranslation();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  return (
    <Grid container item XSmall={12} XLarge={8} direction='column'>
      <Grid item XSmall={12}>
        <Divider />
      </Grid>
      <Grid item XSmall={12} classes={{ root: buttonContainerStyle }}>
        <Grid container direction={isCompactView ? 'column' : 'row'} gap={1}>
          <Button
            classes={{ root: createButton }}
            data-testid='create-subscription-button'
            variant='contained'
            size='large'
            disabled={(!isValidating && !isValid) || isFiatBlockedByVerification}
            onClick={onCreateClick}
            loading={isSubmitting}>
            {translate('Action.Create')}
          </Button>
          <Button
            variant='outlined'
            color='primary'
            size='large'
            onClick={onCancel}
            disabled={isSubmitting}>
            {translate('Action.Cancel')}
          </Button>
        </Grid>
        <ExperienceSubscriptionFormErrorText
          subscriptionErrorMsg={subscriptionErrorMsg}
          subscriptionBackendErrorMessage={subscriptionBackendErrorMessage}
          errorMessageStyle={errorMessageStyle}
          communityStandardsLink={communityStandardsLink}
        />
      </Grid>
    </Grid>
  );
}

export default CreateSubscriptionFormFooter;
