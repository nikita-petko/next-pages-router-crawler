import React, { FunctionComponent, useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { PageLoading } from '@modules/miscellaneous/common';
import { AddIcon, Button, Grid, Link, Typography } from '@rbx/ui';
import { useRouter } from 'next/router';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import { EmptyState } from '@modules/miscellaneous/common/components';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { ExperimentState } from '@modules/remote-configs/api/universeExperimentationClientEnums';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import useMatchmakingContainerStyles from './MatchmakingContainer.styles';
import useConfigurationManagement from '../hooks/useConfigurationManagement';
import ApplyConfigToPlaceDialog from '../components/ApplyConfigToPlaceDialog';
import useShowToastMessage from '../hooks/useShowToastMessage';
import MatchmakingConfigTable from '../components/TableComponents/MatchmakingConfigTable';
import MatchmakingPlacesTable from '../components/TableComponents/MatchmakingPlacesTable';
import ToMatchmakingExperimentCreateOrEditPageButton from '../components/ExperimentComponents/ToMatchmakingExperimentCreateOrEditPageButton';
import useMatchmakingExperiments from '../hooks/useMatchmakingExperiments';
import { ToMatchmakingExperimentCreateOrEditPageButtonLabel } from '../utils/translationGetter';

export interface MatchmakingConfigurationContainerProps {
  error: Error | null;
}
const MatchmakingConfigurationContainer: FunctionComponent<
  React.PropsWithChildren<MatchmakingConfigurationContainerProps>
> = ({ error }) => {
  const {
    classes: { container, button },
  } = useMatchmakingContainerStyles();
  const { translate, translateHTML } = useTranslation();
  const { showSuccessToast, showFailureToast } = useShowToastMessage();
  const { isMatchmakingCustomizationExperimentsAllowed } = useFeatureFlagsForNamespace(
    ['isMatchmakingCustomizationExperimentsAllowed'],
    FeatureFlagNamespace.Matchmaking,
  );
  const { activeExperiment } = useMatchmakingExperiments();
  const {
    handleAddConfiguration,
    handleDeleteConfiguration,
    handleDeleteConfigurationForPlaceId,
    handleApplyConfigurationToPlaceIds,
    placesWithAppliedConfigurations,
    allConfigurationBriefInfoList,
  } = useConfigurationManagement();

  const router = useRouter();
  const universeId = router.query.id as string;
  const [applyConfigDialogOpen, setApplyConfigDialogOpen] = useState<boolean>(false);

  const getConfigCreationLink = useCallback(
    (configId: string) => {
      return dashboard.getCustomMatchmakingConfigurationCreationUrl(Number(universeId), configId);
    },
    [universeId],
  );
  const handleCreateConfigButtonClick = useCallback(async () => {
    const addConfigResponse = await handleAddConfiguration();
    if (addConfigResponse && addConfigResponse) {
      router.push(getConfigCreationLink(addConfigResponse));
    } else {
      showFailureToast('Error.CreateConfigFailed', translate);
    }
  }, [handleAddConfiguration, router, getConfigCreationLink, showFailureToast, translate]);

  const handleDeleteConfigurationFromPlace = useCallback(
    async (placeId: number) => {
      const deleteConfigResponse = handleDeleteConfigurationForPlaceId(placeId);
      if (deleteConfigResponse) {
        showSuccessToast('Success.DeleteConfigFromPlace', translate);
      }
      if (!deleteConfigResponse) {
        showFailureToast('Error.DeleteConfigFromPlace', translate);
      }
    },
    [handleDeleteConfigurationForPlaceId, showFailureToast, showSuccessToast, translate],
  );

  const handleApplyConfigurationToPlace = useCallback(
    (configId: string, placeIds: number[]) => {
      setApplyConfigDialogOpen(false);
      const isSuccessful = handleApplyConfigurationToPlaceIds(configId, placeIds);
      if (isSuccessful) {
        showSuccessToast('Success.ApplyConfigToPlace', translate);
      } else {
        showFailureToast('Error.ApplyConfigToPlace', translate);
      }
    },
    [handleApplyConfigurationToPlaceIds, showFailureToast, showSuccessToast, translate],
  );

  const handleEditConfiguration = useCallback(
    (configId: string) => {
      router.push(dashboard.getCustomMatchmakingEditConfigurationUrl(Number(universeId), configId));
    },
    [router, universeId],
  );

  const handleDeleteConfig = useCallback(
    async (configId: string) => {
      const deleteConfigResponse = await handleDeleteConfiguration(configId);
      if (deleteConfigResponse) {
        showSuccessToast('Success.DeleteConfig', translate);
      }
      if (!deleteConfigResponse) {
        showFailureToast('Error.DeleteConfig', translate);
      }
    },
    [handleDeleteConfiguration, showFailureToast, showSuccessToast, translate],
  );

  const createConfigurationButton = useCallback(
    (isEmptyContainer: boolean, disabled: boolean) => (
      <Button
        data-testid='create-configuration-button'
        disabled={disabled}
        variant='contained'
        size={isEmptyContainer ? 'large' : 'medium'}
        color='primaryBrand'
        aria-label={translate('Heading.CreateConfiguration')}
        onClick={() => handleCreateConfigButtonClick()}>
        <AddIcon />
        <span>
          &nbsp;&nbsp;
          {translate('Heading.CreateConfiguration')}
        </span>
      </Button>
    ),
    [handleCreateConfigButtonClick, translate],
  );

  if (error) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (allConfigurationBriefInfoList && allConfigurationBriefInfoList.length > 0) {
    return (
      <Grid>
        <Grid className={container} container direction='row' justifyContent='flex-start'>
          {createConfigurationButton(false, allConfigurationBriefInfoList.length >= 5)}
          <Button
            className={button}
            data-testid='apply-configuration-button'
            variant='contained'
            size='medium'
            color='secondary'
            aria-label={translate('Label.ApplyToPlaces')}
            onClick={() => setApplyConfigDialogOpen(true)}>
            {translate('Label.ApplyToPlaces')}
          </Button>
          {isMatchmakingCustomizationExperimentsAllowed && (
            <ToMatchmakingExperimentCreateOrEditPageButton
              className={button}
              data-testid='create-matchmaking-experiment-button'
              variant='contained'
              size='medium'
              color='secondary'
              label={translate(
                ToMatchmakingExperimentCreateOrEditPageButtonLabel[
                  activeExperiment?.state ?? ExperimentState.Scheduled
                ] ?? 'Label.CreateExperiment',
              )}
            />
          )}
        </Grid>
        <Grid className={container}>
          <MatchmakingConfigTable
            universeConfigurations={allConfigurationBriefInfoList}
            onEdit={handleEditConfiguration}
            onApplyToPlaces={handleApplyConfigurationToPlace}
            onDeleteConfigFromPlace={handleDeleteConfigurationFromPlace}
            onDeleteConfig={handleDeleteConfig}
          />
          <MatchmakingPlacesTable
            placeConfigs={placesWithAppliedConfigurations}
            onDeleteConfigFromPlace={handleDeleteConfigurationFromPlace}
          />
        </Grid>
        <ApplyConfigToPlaceDialog
          key={new Date().getTime()}
          isOpen={applyConfigDialogOpen}
          onClose={() => setApplyConfigDialogOpen(false)}
          onApplyToPlaces={handleApplyConfigurationToPlace}
        />
      </Grid>
    );
  }

  if (allConfigurationBriefInfoList && allConfigurationBriefInfoList.length === 0) {
    return (
      <EmptyState
        title={translate('Title.NoConfigurations')}
        description={
          <Typography>
            {translateHTML('Description.Configurations', [
              {
                opening: 'startLink',
                closing: 'endLink',
                content(chunks) {
                  return (
                    <Link
                      href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/matchmaking/customize-matchmaking`}>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        }
        size='large'
        illustration='configurations'>
        {createConfigurationButton(true, false)}
      </EmptyState>
    );
  }
  return <PageLoading />;
};

export default MatchmakingConfigurationContainer;
