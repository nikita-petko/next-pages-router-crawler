import React, { Fragment, FunctionComponent, useMemo } from 'react';
import { Grid } from '@rbx/ui';
import { useRouter } from 'next/router';
import { useSettings } from '@modules/settings';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import useQuestionnaireV2Gate from '@modules/experience-questionnaire/hooks/useQuestionnaireV2Gate';

import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';

import Features from './Features';
import Resources from './Resources';
import { featureManagerV2, NavigationFeatureManager } from '../../feature';
import CreatorsContainer from '../../creator/containers/CreatorsContainer';
import useLeftNavigationState from '../../layout/hooks/useLeftNavigationState';
import { TCombinedSettings, TGroupFeaturesParams } from '../../constants';

const LeftNavigation: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const router = useRouter();
  const { settings } = useSettings();
  const currentGroup = useCurrentGroup();
  const { permissions: organizationPermssions } = useCurrentOrganization();
  const creatorDashboardxpParams = useIXPParameters(IXPLayers.CreatorDashboard);
  const { frontendFlags } = useToolboxServiceApiProvider();
  const { shouldUseV2: shouldUseQuestionnaireV2 } = useQuestionnaireV2Gate();

  const combinedSettings: TCombinedSettings = useMemo(() => {
    const groupFeaturesParams: TGroupFeaturesParams = {
      isGroup: currentGroup?.id !== undefined,
    };

    return {
      ...settings,
      ...creatorDashboardxpParams.params,
      ...organizationPermssions,
      ...groupFeaturesParams,
      ...frontendFlags,
      shouldUseQuestionnaireV2,
    };
  }, [
    creatorDashboardxpParams,
    currentGroup?.id,
    frontendFlags,
    organizationPermssions,
    settings,
    shouldUseQuestionnaireV2,
  ]);

  const featureData = useMemo(() => {
    const allFeatures = featureManagerV2.getAllFeatures();
    const enabledFeatures = featureManagerV2.filterDisabledFeatures(allFeatures, combinedSettings);
    const features = featureManagerV2.overrideFeatures(enabledFeatures, currentGroup?.id);

    const allFeaturesFlatten = NavigationFeatureManager.flattenFeatures(enabledFeatures);
    let activeFeature = allFeaturesFlatten.find((feature) =>
      NavigationFeatureManager.matchFeaturePath(feature, router.pathname, router.query),
    );
    if (!activeFeature) {
      // check if match feature path prefix, when acting as root menu
      activeFeature = allFeaturesFlatten
        .sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0)) // match longest path prefix
        .find((feature) => feature.path && router.pathname.startsWith(feature.path));
    }

    return {
      features,
      activeFeature,
    };
  }, [combinedSettings, currentGroup?.id, router.pathname, router.query]);

  const { primarySidebarExpanded } = useLeftNavigationState();

  return (
    <Fragment>
      <Grid item container direction='column'>
        <CreatorsContainer />
      </Grid>
      <Grid XSmall item container direction='column' alignItems='stretch'>
        <Features
          features={featureData.features}
          activeFeature={featureData.activeFeature}
          variant={primarySidebarExpanded ? 'list' : 'iconOnlyList'}
          name='creations'
        />
      </Grid>
      <Grid item container direction='column'>
        <Resources />
      </Grid>
    </Fragment>
  );
};

export default LeftNavigation;
