import { Fragment, useCallback, useState } from 'react';
import NextLink from 'next/link';
import { Button, Divider, Grid, ArrowDropDownIcon, ArrowDropUpIcon } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import type { ExperienceStoreStateResponse } from '@modules/clients/experienceStore';
import { useSetExperienceStoreState } from '@modules/experience-store/queries/useSetExperienceStoreState';
import ExternalPurchaseFeatureActivation from './ExternalPurchaseFeatureActivation';
import ExternalPurchaseInstructionsContainer from './ExternalPurchaseInstructionsContainer';
import ExternalPurchaseSettingsTitle from './ExternalPurchaseSettingsTitle';
import ExternalPurchaseTestModeAlert from './ExternalPurchaseTestModeAlert';
import ExternalPurchaseTestModeConfirmationDialog from './ExternalPurchaseTestModeConfirmationDialog';
import ExternalPurchaseTestModeTitle from './ExternalPurchaseTestModeTitle';
import useExternalPurchaseSettingsStyles from './ExternalPurchaseSettings.styles';

type Props = {
  universeId: number;
  releaseState: ExperienceStoreStateResponse;
};

const getDeveloperProductsUrl = dashboard.getMonetizationDeveloperProductsUrl;

function ExternalPurchaseSettings({ universeId, releaseState }: Props) {
  const { translate } = useTranslation();
  const { classes } = useExternalPurchaseSettingsStyles();

  const [submittingStoreState, setSubmittingStoreState] = useState(false);
  const [testModeDialogOpen, setTestModeDialogOpen] = useState(false);
  const [testModeInstructionsOpen, setTestModeInstructionsOpen] = useState(false);

  const { mutateAsync: setExperienceStoreState, isPending } = useSetExperienceStoreState();

  const setTestModeState = useCallback(
    async (newState: boolean) => {
      const newReleaseState = await setExperienceStoreState({
        universeId,
        testModeState: newState ? 'Enabled' : 'Disabled',
      });
      if (newState && newReleaseState.universeTestModeState === 'Enabled') {
        setTestModeDialogOpen(true);
      }
    },
    [universeId, setExperienceStoreState],
  );

  const toggleFeatureState = useCallback(
    async (_: React.ChangeEvent, checked: boolean) => {
      setSubmittingStoreState(true);
      try {
        if (releaseState.universeTestModeState === 'Enabled') {
          // disable test mode first to toggle feature state
          await setTestModeState(false);
        }

        await setExperienceStoreState({
          universeId,
          universeStorePageState: checked ? 'Enabled' : 'Disabled',
        });
      } catch {
        // do nothing
      } finally {
        setSubmittingStoreState(false);
      }
    },
    [releaseState, setTestModeState, universeId, setExperienceStoreState],
  );

  const isSubmitting = isPending || submittingStoreState;

  return (
    <Grid container direction='column' classes={{ root: classes.pageContentContainer }}>
      <Grid container item direction='column' classes={{ root: classes.formContainer }}>
        <Grid container item>
          <ExternalPurchaseSettingsTitle />
        </Grid>
        <Grid container item classes={{ root: classes.pageSectionContainer }}>
          <ExternalPurchaseTestModeAlert />
        </Grid>
        <ExternalPurchaseTestModeConfirmationDialog
          open={testModeDialogOpen}
          onClose={() => setTestModeDialogOpen(false)}
        />
        <Grid
          container
          item
          alignItems='flex-start'
          classes={{ root: classes.pageSectionContainer }}>
          <ExternalPurchaseTestModeTitle />
          <Button
            className='testModeAccordionOpener'
            onClick={() => setTestModeInstructionsOpen((state) => !state)}>
            {testModeInstructionsOpen ? (
              <Fragment>
                <ArrowDropUpIcon classes={{ root: classes.showTestModeButtonIcon }} />{' '}
                {translate('Label.HideTestModeSettings')}
              </Fragment>
            ) : (
              <Fragment>
                <ArrowDropDownIcon classes={{ root: classes.showTestModeButtonIcon }} />{' '}
                {translate('Label.ShowTestModeSettings')}
              </Fragment>
            )}
          </Button>
          {testModeInstructionsOpen && (
            <ExternalPurchaseInstructionsContainer
              universeTestModeState={releaseState.universeTestModeState}
              onTestModeButtonClick={setTestModeState}
              submitting={isSubmitting}
            />
          )}
        </Grid>
        <ExternalPurchaseFeatureActivation
          featureSwitchState={
            submittingStoreState // Flip the switch when submitting this state for optimistic UI
              ? releaseState.universeStorePageStateType !== 'Enabled'
              : releaseState.universeStorePageStateType === 'Enabled'
          }
          onClickFeatureSwitch={toggleFeatureState}
          disabled={
            releaseState.universeStorePageStateType === 'Invalid' ||
            releaseState.universeStorePageStateType === 'NotPassedTest'
          }
          submitting={isSubmitting}
        />
      </Grid>
      <Divider classes={{ root: classes.bottomDivider }} />
      <Button
        component={NextLink}
        variant='outlined'
        classes={{ root: classes.backToDeveloperProductsButton }}
        color='secondary'
        size='large'
        href={getDeveloperProductsUrl(universeId)}>
        {translate('Label.BackToDeveloperProducts')}
      </Button>
    </Grid>
  );
}

export default ExternalPurchaseSettings;
