import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Grid,
  Typography,
  Link,
  Button,
  TextField,
  Divider,
  HelpIcon,
  Dialog,
  DialogContent,
  DialogActions,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Controller, useForm } from 'react-hook-form';
import { MockServerSignalValues } from '@rbx/clients/matchmakingApi/v1';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { FormMode, PageLoading, YoutubeVideo } from '@modules/miscellaneous/common';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import {
  ExperimentProductType,
  ExperimentState,
} from '@modules/remote-configs/api/universeExperimentationClientEnums';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import {
  ConfigurationDetailedInfo,
  CustomSignal,
  CustomSignalServerValue,
  ServerSignalScores,
  ServerSignalValues,
} from '../types/ConfigurationInfo';
import { PlaceInfo } from '../types/PlaceInfo';
import { getConfigurationDefaultValues } from '../utils/FormUtils';
import useConfigurationSimulationContainerStyles from './ConfigurationSimulationContainer.styles';
import SaveConfigurationDialog from '../components/SaveConfigurationDialog';
import useShowToastMessage from '../hooks/useShowToastMessage';
import {
  getCustomSignalsWeightsMapFromConfig,
  getDefaultSignalsWeightsMap,
  getDefaultSignalValues,
  usingDefaultWeights,
} from '../utils/ConfigurationUtils';
import DefaultConfigurationSignals from '../enums/DefaultConfigurationSignals';
import useConfigurationManagement from '../hooks/useConfigurationManagement';
import SignalWeightSetterForm from '../components/SignalWeightSetterForm';
import SimulationTable from '../components/SimulationComponents/SimulationTable';
import SignalStackedColumnChart from '../components/ChartComponents/SignalStackedColumnChart';
import {
  calculateTotalScore,
  getCustomSignalServerValues,
  getCustomSignalsScoresMap,
  getDefaultSignalsScoresMap,
  getServerScoreMaps,
  getServerValues,
} from '../utils/SimulationScoreUtils';
import { delayInMs, videoId } from '../constants';
import useMatchmakingExperiments from '../hooks/useMatchmakingExperiments';
import ConfigurationUsedInExperimentAlert from '../components/ExperimentComponents/ConfigurationUsedInExperimentAlert';

export type ConfigurationSimulationContainerProps = {
  isEditingConfiguration: boolean;
  currentConfiguration: ConfigurationDetailedInfo;
  placesInfo: PlaceInfo[] | null;
};

const ConfigurationSimulationContainer: FunctionComponent<
  React.PropsWithChildren<ConfigurationSimulationContainerProps>
> = ({ isEditingConfiguration, currentConfiguration }) => {
  const {
    classes: { container, button, title, video },
  } = useConfigurationSimulationContainerStyles();
  const { translate, translateHTML } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const { showSuccessToast, showFailureToast } = useShowToastMessage();
  const router = useRouter();
  const {
    handleUpdateConfiguration,
    handleApplyConfigurationToPlaceIds,
    isUpdatingConfigurations,
    isUpdatingCustomSignals,
    isLoadingCurrentConfiguration,
    defaultSignalWeights,
    defaultServerValues,
  } = useConfigurationManagement();

  const { isMatchmakingCustomizationExperimentsAllowed, isMatchmakingTextChatSignalEnabled } =
    useFeatureFlagsForNamespace(
      ['isMatchmakingCustomizationExperimentsAllowed', 'isMatchmakingTextChatSignalEnabled'],
      FeatureFlagNamespace.Matchmaking,
    );
  const { activeExperiment, currentConfigurationDraftExperiment } = useMatchmakingExperiments();

  // Check if current configuration is used in a running experiment
  const currentConfigurationIsUsedInRunningExperiment = useMemo(() => {
    if (!isMatchmakingCustomizationExperimentsAllowed) return false;
    return (
      !!activeExperiment &&
      activeExperiment.state === ExperimentState.Running &&
      activeExperiment.experimentType === ExperimentProductType.Matchmaking &&
      activeExperiment?.variants?.some(
        (variant) =>
          // Check if this is a matchmaking experiment variant with placeMatchmakingConfigs
          'placeMatchmakingConfigs' in variant &&
          variant.placeMatchmakingConfigs.some(
            (config) => config.matchmakingScoringConfigId === currentConfiguration.id,
          ),
      )
    );
  }, [activeExperiment, currentConfiguration.id, isMatchmakingCustomizationExperimentsAllowed]);

  // Determine which experiment to show in the alert (active experiment takes priority)
  const experimentToShowInAlert = useMemo(() => {
    if (currentConfigurationIsUsedInRunningExperiment && activeExperiment) {
      return activeExperiment;
    }
    return currentConfigurationDraftExperiment;
  }, [
    currentConfigurationIsUsedInRunningExperiment,
    activeExperiment,
    currentConfigurationDraftExperiment,
  ]);

  const { control, formState, watch, setValue, getValues } = useForm<ConfigurationDetailedInfo>({
    mode: FormMode.OnTouched,
    reValidateMode: FormMode.OnChange,
    defaultValues: getConfigurationDefaultValues(currentConfiguration),
  });
  const { errors, isDirty } = formState;
  const formValues = watch();
  const [hasWeightSetterError, setHasWeightSetterError] = useState<boolean>(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [simulationTableOpen, setSimulationTableOpen] = useState<boolean>(false);
  const [isLoadingTable, setIsLoadingTable] = useState<boolean>(false);

  // weights
  const [customSignalWeightsMap, setCustomSignalWeightsMap] = useState<Map<string, CustomSignal>>(
    getCustomSignalsWeightsMapFromConfig(currentConfiguration?.customSignals),
  );
  const [defaultSignalWeightsMap, setDefaultSignalsMap] = useState<Map<string, number>>(
    getDefaultSignalsWeightsMap(currentConfiguration?.defaultSignals),
  );

  // TODO: (@yqiu) Remove the filter once text chat signal is enabled by default
  // Sync defaultSignalWeightsMap when the flag or configuration changes
  useEffect(() => {
    const filteredSignals = Array.from(
      getDefaultSignalsWeightsMap(currentConfiguration?.defaultSignals),
    ).filter(([signal]) => {
      if (signal === DefaultConfigurationSignals.TextChat) {
        return isMatchmakingTextChatSignalEnabled;
      }
      return true;
    });
    setDefaultSignalsMap(new Map(filteredSignals));
  }, [isMatchmakingTextChatSignalEnabled, currentConfiguration?.defaultSignals]);

  const [isUsingDefaultWeights, setIsUsingDefaultWeights] = useState(
    usingDefaultWeights(currentConfiguration?.defaultSignals, defaultSignalWeights),
  );

  // simulation
  const [updatedServerValues, setUpdatedServerValues] = useState<ServerSignalValues[]>(
    getServerValues(defaultServerValues ?? [], currentConfiguration?.customSignals ?? []),
  );
  const [signalScoresMaps, setSignalScoresMaps] = useState<ServerSignalScores[]>(
    defaultServerValues?.map((value) =>
      getServerScoreMaps(
        value,
        defaultSignalWeightsMap,
        getCustomSignalServerValues(currentConfiguration?.customSignals ?? [], value),
        customSignalWeightsMap,
      ),
    ) ?? [],
  );
  const [scores, setScores] = useState<number[]>(
    signalScoresMaps.map((score) => calculateTotalScore(score)),
  );
  const [topServerIndex, setTopServerIndex] = useState<number | undefined>(
    scores.indexOf(Math.max(...scores)),
  );

  const handleWeightsChanges = useCallback(
    (defaultSignalMap: Map<string, number>, customSignalWeights: Map<string, CustomSignal>) => {
      const newDefaultSignalScoresMaps = updatedServerValues.map((value) =>
        getServerScoreMaps(
          value.defaultSignalServerValues,
          defaultSignalMap,
          value.customSignalServerValues,
          customSignalWeights,
        ),
      );
      setSignalScoresMaps(newDefaultSignalScoresMaps);
      const newScores = newDefaultSignalScoresMaps.map((scoreMap) => calculateTotalScore(scoreMap));
      setScores(newScores);
      const winningServerIndex = newScores.indexOf(Math.max(...newScores));
      setTopServerIndex(winningServerIndex);
    },
    [updatedServerValues],
  );

  const handleDefaultSignalValueChanges = useCallback(
    (serverNumber: number, serverValue: MockServerSignalValues) => {
      const index = serverNumber - 1;
      const newValues = [...updatedServerValues];
      newValues[index].defaultSignalServerValues = serverValue;
      setUpdatedServerValues(newValues);

      const newMap = getDefaultSignalsScoresMap(serverValue, defaultSignalWeightsMap);
      const newMaps = [...signalScoresMaps];
      newMaps[index].defaultSignalScores = newMap;
      setSignalScoresMaps(newMaps);

      const newScores = [...scores];
      newScores[index] = calculateTotalScore(newMaps[index]);
      setScores(newScores);

      const winningServerIndex = newScores.indexOf(Math.max(...newScores));
      setTopServerIndex(winningServerIndex);
    },
    [defaultSignalWeightsMap, scores, signalScoresMaps, updatedServerValues],
  );

  const handleCustomSignalValueChanges = useCallback(
    (serverNumber: number, customSignalServerValues: Map<string, CustomSignalServerValue>) => {
      const index = serverNumber - 1;
      const newValues = [...updatedServerValues];
      newValues[index].customSignalServerValues = customSignalServerValues;
      setUpdatedServerValues(newValues);

      const newMap = getCustomSignalsScoresMap(customSignalServerValues, customSignalWeightsMap);
      const newMaps = [...signalScoresMaps];
      newMaps[index].customSignalScores = newMap;
      setSignalScoresMaps(newMaps);

      const newScores = [...scores];
      newScores[index] = calculateTotalScore(newMaps[index]);
      setScores(newScores);

      const winningServerIndex = newScores.indexOf(Math.max(...newScores));
      setTopServerIndex(winningServerIndex);
    },
    [customSignalWeightsMap, scores, signalScoresMaps, updatedServerValues],
  );

  const fieldRules = {
    required: 'Error.Required',
    maxLength: 50,
  };

  const configDescription = translateHTML('Description.CustomConfiguration', [
    {
      opening: 'startLink',
      closing: 'endLink',
      content(chunks) {
        return (
          <Link
            href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/matchmaking/customize-matchmaking`}
            target='_blank'
            underline='always'>
            {chunks}
          </Link>
        );
      },
    },
  ]);

  const onWeightSetterError = useCallback((hasError: boolean) => {
    setHasWeightSetterError(hasError);
  }, []);

  const handleDefaultSignalWeightReset = useCallback(() => {
    const currValues = getDefaultSignalValues(defaultSignalWeightsMap);
    if (usingDefaultWeights(currValues, defaultSignalWeights)) {
      return;
    }
    const newMap = new Map();
    newMap.set(DefaultConfigurationSignals.Occupancy, defaultSignalWeights?.occupancy ?? 0);
    newMap.set(DefaultConfigurationSignals.AgeDifference, defaultSignalWeights?.age ?? 0);
    newMap.set(DefaultConfigurationSignals.Language, defaultSignalWeights?.language ?? 0);
    newMap.set(DefaultConfigurationSignals.Latency, defaultSignalWeights?.latency ?? 0);
    newMap.set(
      DefaultConfigurationSignals.PreferredPlayers,
      defaultSignalWeights?.preferredPlayers ?? 0,
    );
    newMap.set(DefaultConfigurationSignals.VoiceChat, defaultSignalWeights?.voiceChat ?? 0);
    newMap.set(DefaultConfigurationSignals.DeviceType, defaultSignalWeights?.deviceType ?? 0);
    newMap.set(DefaultConfigurationSignals.PlayHistory, defaultSignalWeights?.playHistory ?? 0);
    // TODO: (@yqiu) Remove the filter once text chat signal is enabled by default
    if (isMatchmakingTextChatSignalEnabled) {
      newMap.set(DefaultConfigurationSignals.TextChat, defaultSignalWeights?.textChat ?? 0);
    }

    setDefaultSignalsMap(newMap);
    handleWeightsChanges(newMap, customSignalWeightsMap);
    setValue('defaultSignals', defaultSignalWeights, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setIsUsingDefaultWeights(true);
  }, [
    customSignalWeightsMap,
    defaultSignalWeights,
    defaultSignalWeightsMap,
    handleWeightsChanges,
    setValue,
    isMatchmakingTextChatSignalEnabled, // TODO: (@yqiu) Remove the filter once text chat signal is enabled by default
  ]);

  const handleDefaultSignalWeightChange = useCallback(
    (signalName: string, weight: number) => {
      const newMap = new Map(defaultSignalWeightsMap);
      newMap.set(signalName as keyof typeof DefaultConfigurationSignals, weight);
      setDefaultSignalsMap(newMap);
      handleWeightsChanges(newMap, customSignalWeightsMap);

      const formDefaultValues = getDefaultSignalValues(newMap);
      setIsUsingDefaultWeights(usingDefaultWeights(formDefaultValues, defaultSignalWeights));
      setValue('defaultSignals', formDefaultValues, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [
      customSignalWeightsMap,
      defaultSignalWeights,
      defaultSignalWeightsMap,
      handleWeightsChanges,
      setValue,
    ],
  );

  const handleCustomSignalWeightChange = useCallback(
    (signalName: string, signal: CustomSignal) => {
      const newMap = new Map(customSignalWeightsMap);
      newMap.set(signalName, signal);
      setCustomSignalWeightsMap(newMap);
      handleWeightsChanges(defaultSignalWeightsMap, newMap);
      const customSignals = getValues('customSignals');
      const currSignal = customSignals?.find((sig) => sig.name === signalName);
      if (currSignal) {
        currSignal.weight = signal.weight;
        setValue('customSignals', customSignals, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    },
    [customSignalWeightsMap, defaultSignalWeightsMap, getValues, handleWeightsChanges, setValue],
  );

  const handleCustomSignalDeletion = useCallback(
    (signalName: string) => {
      const newMap = new Map(customSignalWeightsMap);
      newMap.delete(signalName);
      setCustomSignalWeightsMap(newMap);
      handleWeightsChanges(defaultSignalWeightsMap, newMap);
    },
    [customSignalWeightsMap, defaultSignalWeightsMap, handleWeightsChanges],
  );

  const handleFormSave = useCallback(
    async (selectedPlaceIds: number[]) => {
      setIsDialogOpen(false);
      const isApplyToPlacesSuccessful = handleApplyConfigurationToPlaceIds(
        currentConfiguration.id,
        selectedPlaceIds,
      );
      const isConfigUpdateSuccessful = await handleUpdateConfiguration(formValues);
      if (isApplyToPlacesSuccessful && isConfigUpdateSuccessful) {
        router.push(dashboard.getCustomMatchmakingDashboardUrl(Number(gameDetails?.id)));
        showSuccessToast('Message.ConfigurationUpdateSuccess', translate);
      } else {
        showFailureToast('Error.ConfigurationUpdate', translate);
      }
    },
    [
      currentConfiguration.id,
      formValues,
      gameDetails?.id,
      handleApplyConfigurationToPlaceIds,
      handleUpdateConfiguration,
      router,
      showFailureToast,
      showSuccessToast,
      translate,
    ],
  );

  const handleSaveButtonClick = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleOpenSimulationTable = () => {
    setIsLoadingTable(true);
    setTimeout(() => {
      setIsLoadingTable(false);
      setSimulationTableOpen(true);
    }, delayInMs);
  };

  const appliedPlaces = currentConfiguration?.appliedPlaces
    ? Array.from(currentConfiguration?.appliedPlaces?.values())
    : [];

  if (isLoadingCurrentConfiguration || isUpdatingConfigurations || isUpdatingCustomSignals) {
    return <PageLoading />;
  }
  return (
    <Grid>
      <Grid item display='flex' direction='column' className={title}>
        <Typography variant='h1'>
          {isEditingConfiguration
            ? translate('Heading.EditCustomConfiguration')
            : translate('Heading.CustomConfiguration')}
        </Typography>
        <HubMeta
          hubOnly
          title={buildTitle(
            isEditingConfiguration
              ? translate('Heading.EditCustomConfiguration')
              : translate('Heading.CustomConfiguration'),
          )}
        />
        <Grid item display='flex' direction='row' justifyContent='space-between'>
          <Typography variant='body1'>{configDescription}</Typography>
          <Grid item display='flex' direction='row' alignItems='center'>
            <Button variant='text' color='primaryBrand' onClick={() => setIsInfoDialogOpen(true)}>
              <HelpIcon />
              <Typography style={{ marginLeft: 5, marginTop: 2 }} variant='buttonMedium'>
                {translate('Label.HowItWorks')}
              </Typography>
            </Button>
          </Grid>
        </Grid>
        {experimentToShowInAlert && (
          <ConfigurationUsedInExperimentAlert experiment={experimentToShowInAlert} />
        )}
        <Dialog
          open={isInfoDialogOpen}
          onClose={() => setIsInfoDialogOpen(false)}
          maxWidth='Medium'
          fullWidth>
          <DialogContent>
            <Grid item display='flex' direction='column' style={{ marginLeft: 10 }}>
              <Grid style={{ marginBottom: 20, marginTop: 5 }}>
                <YoutubeVideo videoId={videoId} className={video} />
              </Grid>
              <Typography variant='h3' style={{ marginBottom: 20 }}>
                {translate('Dialog.HowItWorks')}
              </Typography>
              <Typography variant='body1' whiteSpace='pre-wrap'>
                {translate('Dialog.MatchmakingBody')}
              </Typography>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              variant='contained'
              size='large'
              color='primary'
              onClick={() => setIsInfoDialogOpen(false)}
              fullWidth>
              {translate('Button.GotIt')}
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>

      <Grid container direction='row' className={container}>
        <Grid item XSmall={3}>
          <Controller
            name='name'
            control={control}
            rules={fieldRules}
            render={({ field }) => (
              <TextField
                {...field}
                error={!!errors.name}
                fullWidth
                required
                id='name'
                inputProps={{ maxLength: 50 }}
                label={translate('Label.ConfigurationName')}
                helperText={
                  errors.name && errors.name.message
                    ? translate(errors.name?.message ?? '')
                    : translate('Label.ConfigurationNameHelperText')
                }
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setValue('name', event.target.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                disabled={currentConfigurationIsUsedInRunningExperiment}
              />
            )}
          />
        </Grid>
        <Button
          className={button}
          variant='contained'
          aria-label='save configuration'
          onClick={handleSaveButtonClick}
          disabled={
            currentConfigurationIsUsedInRunningExperiment ||
            hasWeightSetterError ||
            !!errors.name ||
            !isDirty
          }>
          {translate('Button.SaveConfiguration')}
        </Button>
        <SaveConfigurationDialog
          appliedPlaces={appliedPlaces}
          isDialogOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onConfirm={handleFormSave}
        />
      </Grid>
      <Divider />
      <Grid container direction='row' position='sticky'>
        <SignalWeightSetterForm
          isUsingDefaultWeights={isUsingDefaultWeights}
          config={currentConfiguration}
          customSignalWeightsMap={customSignalWeightsMap}
          defaultSignalWeightsMap={defaultSignalWeightsMap}
          hasWeightSetterError={onWeightSetterError}
          onDefaultSignalWeightChange={handleDefaultSignalWeightChange}
          onCustomSignalWeightChange={handleCustomSignalWeightChange}
          onCustomSignalDelete={handleCustomSignalDeletion}
          onResetDefaultWeights={handleDefaultSignalWeightReset}
          disabled={currentConfigurationIsUsedInRunningExperiment} // disable if the configuration is used in a running experiment
        />
        <Divider orientation='vertical' flexItem />
        <Grid item XSmall={8.5} style={{ marginTop: 10 }} position='sticky'>
          <SimulationTable
            isLoading={isLoadingTable}
            simulationTableOpen={simulationTableOpen}
            winningServerIndex={topServerIndex}
            serverScores={scores}
            serverSignalValues={updatedServerValues}
            signalScores={signalScoresMaps}
            customSignalWeightsMap={customSignalWeightsMap}
            defaultSignalWeightsMap={defaultSignalWeightsMap}
            onDefaultSignalValueChanges={handleDefaultSignalValueChanges}
            onCustomSignalValuesChange={handleCustomSignalValueChanges}
            onSimulationTableOpen={handleOpenSimulationTable}
          />
        </Grid>
      </Grid>
      <Divider />
      {simulationTableOpen && (
        <SignalStackedColumnChart
          winningServerIndex={topServerIndex}
          serverScores={scores}
          signalScores={signalScoresMaps}
          customSignals={currentConfiguration?.customSignals}
          defaultSignalWeightsMap={defaultSignalWeightsMap}
        />
      )}
    </Grid>
  );
};

export default ConfigurationSimulationContainer;
