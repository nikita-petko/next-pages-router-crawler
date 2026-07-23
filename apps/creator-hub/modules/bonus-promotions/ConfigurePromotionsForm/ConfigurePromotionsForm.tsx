import { useCallback, useState } from 'react';
import NextLink from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  AccessTimeIcon,
  Grid,
  Checkbox,
  Typography,
  Button,
  useSnackbar,
  FormHelperText,
  Tooltip,
  InfoOutlinedIcon,
  FormControlLabel,
  ErrorIcon,
  CheckCircleOutlineIcon,
} from '@rbx/ui';
import { BonusOptInModerationStatus } from '@modules/clients/bonusItem';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { useUpdateGamePassBonusOptIn } from '../queries/useUpdateGamePassBonusOptIn';
import useConfigurePromotionsFormStyles from './ConfigurePromotionsForm.styles';
import type { ConfigurePromotionsFormType } from './types';

type ModerationStatusProps = {
  moderationStatus: BonusOptInModerationStatus;
  className?: string;
};

const ModerationStatus = ({ moderationStatus, className }: ModerationStatusProps) => {
  const { translate } = useTranslation();

  return (
    <div
      className={clsx('flex items-center', className)}
      data-testid='promotions-opt-in-moderation-status'>
      {moderationStatus === BonusOptInModerationStatus.PendingReview && (
        <>
          <AccessTimeIcon fontSize='medium' color='warning' />
          <Typography variant='body1'>
            {translate('Label.BonusOptInModerationStatusPendingReview')}
          </Typography>
        </>
      )}
      {moderationStatus === BonusOptInModerationStatus.Approved && (
        <>
          <CheckCircleOutlineIcon fontSize='medium' color='success' />
          <Typography variant='body1'>
            {translate('Label.BonusOptInModerationStatusApproved')}
          </Typography>
        </>
      )}
      {moderationStatus === BonusOptInModerationStatus.Rejected && (
        <>
          <ErrorIcon fontSize='medium' color='error' />
          <Typography variant='body1'>
            {translate('Label.BonusOptInModerationStatusRejected')}
          </Typography>
        </>
      )}
    </div>
  );
};

type TConfigurePromotionsProps = {
  universeId: number;
  passId: number;
  isForPromotions: boolean;
  isEligibleForPromotions: boolean;
  moderationStatus: BonusOptInModerationStatus;
};

const getPassesUrl = dashboard.getMonetizationPassesUrl;

const ConfigurePromotionsForm = ({
  universeId,
  passId,
  isForPromotions,
  isEligibleForPromotions,
  moderationStatus,
}: TConfigurePromotionsProps) => {
  const { classes } = useConfigurePromotionsFormStyles();

  const { reset, control, formState, handleSubmit } = useForm<ConfigurePromotionsFormType>({
    mode: FormMode.All,
    reValidateMode: FormMode.OnChange,
    defaultValues: {
      isForPromotions,
    },
  });

  const { isValid, isDirty, isSubmitting } = formState;
  const { translate } = useTranslation();
  const { enqueue } = useSnackbar();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passesLink = getPassesUrl(universeId);

  const showSuccessToast = useCallback(() => {
    enqueue(
      { message: translate('Message.PassConfigureSuccess'), autoHide: true },
      (reason) => reason === 'timeout',
    );
  }, [enqueue, translate]);

  const { mutateAsync: updateOptInStatus } = useUpdateGamePassBonusOptIn(
    { universeId, gamePassId: passId },
    { onSuccess: showSuccessToast },
  );

  const saveChanges = useCallback(
    async (data: ConfigurePromotionsFormType) => {
      setErrorMessage('');

      try {
        await updateOptInStatus({ isOptedIn: data.isForPromotions === true });

        reset(data);
      } catch {
        setErrorMessage(translate('Error.PassConfigureGeneralError'));
      }
    },
    [updateOptInStatus, reset, translate],
  );

  const isSubmitDisabled = !isEligibleForPromotions || !isDirty || !isValid;

  return (
    <Grid
      container
      direction='column'
      component='form'
      onSubmit={handleSubmit(saveChanges)}
      data-testid='promotions-opt-in-form'>
      <Grid item className={classes.itemForPromotionsLabel}>
        <Typography variant='h6'>{translate('Description.ItemForPromotions')}</Typography>
        <Tooltip
          title={translate('Tooltip.ItemForPromotions')}
          placement='right'
          arrow
          enterTouchDelay={0}>
          <InfoOutlinedIcon fontSize='small' />
        </Tooltip>
      </Grid>

      <Controller
        name='isForPromotions'
        control={control}
        render={({ field }) => (
          <FormControlLabel
            className={classes.itemForPromotions}
            label={translate('Label.ItemForPromotions')}
            control={
              <Checkbox
                {...field}
                checked={field.value ?? undefined}
                aria-label={translate('Label.ItemForPromotions')}
                disabled={!isEligibleForPromotions}
                data-testid='promotions-opt-in-checkbox'
              />
            }
          />
        )}
      />
      <ModerationStatus moderationStatus={moderationStatus} className={classes.moderationStatus} />

      <div className={classes.buttonContainer}>
        <Button
          variant='outlined'
          color='primary'
          size='large'
          component={NextLink}
          href={passesLink}
          disabled={isSubmitting}
          data-testid='promotions-opt-in-cancel-button'>
          {translate('Action.Cancel')}
        </Button>
        <Button
          type='submit'
          variant='contained'
          size='large'
          disabled={isSubmitDisabled}
          loading={isSubmitting}
          data-testid='promotions-opt-in-save-button'>
          {translate('Action.ConfigurePass')}
        </Button>
      </div>

      {errorMessage && (
        <FormHelperText error classes={{ root: classes.errorMessageStyles }}>
          {errorMessage}
        </FormHelperText>
      )}
    </Grid>
  );
};

export default ConfigurePromotionsForm;
