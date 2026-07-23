import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  Grid,
  Typography,
  useSnackbar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@rbx/ui';
import openCloudV2Client, { V2Protos } from '@modules/clients/openCloud';
import { useRouter } from 'next/router';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import useConfigureEnvironmentFormStyles from './ConfigureEnvironmentForm.styles';
import { isSpecialEnvironment } from '../utils/environmentUtils';
import EnvironmentFormInputs from './EnvironmentFormInputs';

interface ConfigureEnvironmentFormProps {
  environment: V2Protos.IEnvironment;
}

interface EnvironmentFormData {
  displayName: string;
  slug: string;
}

const ConfigureEnvironmentForm: FunctionComponent<ConfigureEnvironmentFormProps> = ({
  environment,
}) => {
  const { classes } = useConfigureEnvironmentFormStyles();
  const { translate } = useTranslation();
  const { enqueue } = useSnackbar();
  const router = useRouter();
  const { id: gameId, environmentId } = router.query;
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    if (isSpecialEnvironment(environment)) {
      router.replace('/404');
    }
  }, [environment, router]);

  const isDisabled = isSpecialEnvironment(environment) || environment.state === 'ARCHIVED';

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isDirty, errors },
    reset,
    watch,
    setError,
    setValue,
    clearErrors,
  } = useForm<EnvironmentFormData>({
    mode: FormMode.OnTouched,
    defaultValues: {
      displayName: environment.displayName || '',
      slug: environment.slug || '',
    },
  });

  const showSuccessToast = useCallback(() => {
    enqueue(
      {
        message: translate('Message.EnvironmentUpdateSuccess'),
        autoHide: true,
      },
      (reason) => reason === 'timeout',
    );
  }, [enqueue, translate]);

  const backToEnvironmentsList = useCallback(async () => {
    await router.replace(`/dashboard/creations/experiences/${gameId}/environments`);
  }, [router, gameId]);

  const onSubmit = async (data: EnvironmentFormData) => {
    try {
      if (!gameId || !environmentId) return;

      await openCloudV2Client.updateEnvironment({
        environment: {
          path: `universes/${gameId}/environments/${environmentId}`,
          displayName: data.displayName,
          slug: data.slug,
        },
      });
      showSuccessToast();
      reset(data);
    } catch (error) {
      if (error instanceof Error) {
        enqueue({
          message: error.message,
          autoHide: true,
        });
      } else {
        enqueue({
          message: translate('Error.EnvironmentUpdateFailed'),
          autoHide: true,
        });
      }
    }
  };

  const handleArchiveClick = () => {
    setIsArchiveModalOpen(true);
  };

  const handleArchiveCancel = () => {
    setIsArchiveModalOpen(false);
  };

  const handleArchiveConfirm = async () => {
    try {
      if (!gameId || !environmentId) return;

      setIsArchiving(true);
      await openCloudV2Client.archiveEnvironment({
        path: `universes/${gameId}/environments/${environmentId}`,
      });
      showSuccessToast();
      setIsArchiveModalOpen(false);
      backToEnvironmentsList();
    } catch (error) {
      if (error instanceof Error) {
        enqueue({
          message: error.message,
          autoHide: true,
        });
      } else {
        enqueue({
          message: translate('Error.ArchiveFailed'),
          autoHide: true,
        });
      }
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <Grid container direction='column' className={classes.formPadding}>
      <Grid item>
        <Typography variant='h1'>{translate('Label.BasicSettings')}</Typography>
      </Grid>
      <Grid item>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <EnvironmentFormInputs
              register={register}
              setError={setError}
              errors={errors}
              watch={watch}
              setValue={setValue}
              clearErrors={clearErrors}
              disabled={isDisabled}
            />
          </Grid>
          <Grid item>
            <Typography variant='smallLabel1' color='secondary'>
              {translate('Label.ID', { id: environment.id || '' })}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid item>
        <Divider />
      </Grid>
      <Grid item>
        <Grid
          container
          direction='row'
          spacing={4}
          className={classes.inputFormPadding}
          justifyContent='space-between'
          alignItems='center'>
          <Grid item>
            <Grid container spacing={2}>
              <Grid item>
                <Button
                  variant='outlined'
                  color='primary'
                  size='large'
                  onClick={backToEnvironmentsList}
                  disabled={isSubmitting || isDisabled}>
                  {translate('Action.Cancel')}
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant='contained'
                  size='large'
                  disabled={!isDirty || isSubmitting || !!errors.slug || isDisabled}
                  className={classes.buttonStyle}
                  onClick={handleSubmit(onSubmit)}>
                  {translate('Action.SaveChanges')}
                </Button>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Button
              variant='outlined'
              color='destructive'
              size='large'
              onClick={handleArchiveClick}
              disabled={isSubmitting || isDisabled}>
              {translate('Action.Archive')}
            </Button>
          </Grid>
        </Grid>
      </Grid>

      {/* Archive Confirmation Modal */}
      <Dialog open={isArchiveModalOpen} onClose={handleArchiveCancel} fullWidth>
        <DialogTitle>
          {translate('Heading.ArchiveEnvironment', { name: environment.displayName || '' })}
        </DialogTitle>
        <DialogContent>
          <Typography variant='body1' color='secondary' component='div'>
            <ReactMarkdown>{translate('Body.ArchiveExplanation')}</ReactMarkdown>
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button variant='outlined' color='primary' onClick={handleArchiveCancel}>
            {translate('Action.Cancel')}
          </Button>
          <Button
            variant='contained'
            color='destructive'
            onClick={handleArchiveConfirm}
            disabled={isArchiving}>
            {translate('Action.Archive')}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default withTranslation(ConfigureEnvironmentForm, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Environments,
]);
