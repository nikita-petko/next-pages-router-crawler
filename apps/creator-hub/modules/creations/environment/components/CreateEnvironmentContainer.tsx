import { FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import openCloudV2Client from '@modules/clients/openCloud';
import { Grid, Button, Typography, Divider } from '@rbx/ui';
import { useForm } from 'react-hook-form';
import EnvironmentFormInputs from './EnvironmentFormInputs';
import useConfigureEnvironmentFormStyles from './ConfigureEnvironmentForm.styles';

interface EnvironmentFormData {
  displayName: string;
  slug: string;
}

const CreateEnvironmentContainer: FunctionComponent = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { id: gameId } = router.query;
  const { gameDetails: game } = useCurrentGame();
  const {
    classes: { formPadding, inputFormPadding },
  } = useConfigureEnvironmentFormStyles();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    watch,
    setError,
    setValue,
    clearErrors,
  } = useForm<EnvironmentFormData>({
    mode: 'onChange',
    defaultValues: {
      displayName: '',
      slug: '',
    },
  });

  const onSubmit = async (data: EnvironmentFormData) => {
    if (!game?.id) return;

    try {
      await openCloudV2Client.createEnvironment({
        parent: openCloudV2Client.universePath(game.id.toString()),
        environment: {
          displayName: data.displayName || '',
          slug: data.slug,
        },
      });

      router.push(`/dashboard/creations/experiences/${gameId}/environments/${data.slug}/configure`);
    } catch (err) {
      setError('slug', {
        message: err instanceof Error ? err.message : translate('Error.EnvironmentCreateFailed'),
      });
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/creations/experiences/${gameId}/environments`);
  };

  if (!game?.id) {
    return null;
  }

  return (
    <Grid container direction='column' className={formPadding}>
      <Grid item>
        <Typography variant='h1' gutterBottom>
          {translate('Heading.CreateEnvironment')}
        </Typography>
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
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid item>
        <Divider />
      </Grid>
      <Grid item>
        <Grid
          container
          spacing={2}
          direction='row'
          alignItems='center'
          className={inputFormPadding}>
          <Grid item>
            <Button
              variant='outlined'
              color='secondary'
              disabled={isSubmitting}
              onClick={handleCancel}>
              {translate('Action.Cancel')}
            </Button>
          </Grid>
          <Grid item>
            <Button
              type='submit'
              variant='contained'
              color='primaryBrand'
              disabled={isSubmitting || !!errors.slug}
              onClick={handleSubmit(onSubmit)}>
              {translate('Action.Save')}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default CreateEnvironmentContainer;
