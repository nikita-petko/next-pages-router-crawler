import React, { PropsWithChildren } from 'react';
import { LinearProgress } from '@rbx/ui';
import { useQuery } from '@tanstack/react-query';
import { NavigationConfigsProvider, TProductKey } from '@rbx/creator-hub-navigation';
import AppNavigationLayout, {
  type AppLayoutProps,
} from '@modules/navigation/layout/components/AppLayout';
import getNavigationEnvironment from '@modules/navigation/utils/getNavigationEnvironment';
import { useSettings } from '@modules/settings';
import { useTranslation } from '@rbx/intl';
import { fetchIXPParametersForCurrentUser, IXPLayers } from '@modules/clients/ixpExperiments';
import { HubMeta } from '@rbx/creator-hub-history';
import CreatorHubLayout, { TCreatorHubLayoutProps } from './CreatorHubLayout';

type IALayoutExperimentProps = TCreatorHubLayoutProps &
  AppLayoutProps & { product?: TProductKey; usePrimaryInGuestMode?: boolean };

const IALayoutExperiment: React.FC<PropsWithChildren<IALayoutExperimentProps>> = ({
  product,
  children,
  beta,
  title,
  secondarySize = 'large',
  secondaryRail,
  omitPageTitle,
  usePrimaryInGuestMode = false,
  ...appNavigationProps
}) => {
  const { noBreadCrumbs, leftNavigationContents } = appNavigationProps;
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const { translate } = useTranslation();
  const { data, isFetched } = useQuery({
    queryKey: ['ixp', IXPLayers.CreatorHubNavigationUser],
    queryFn: () => fetchIXPParametersForCurrentUser(IXPLayers.CreatorHubNavigationUser),
  });

  const translatedTitle = typeof title === 'string' ? translate(title) : undefined;

  if (!isFetched) {
    return <LinearProgress title='loading' />;
  }

  const rail = secondaryRail || leftNavigationContents;

  return (
    <React.Fragment>
      {noBreadCrumbs && translatedTitle && <HubMeta title={translatedTitle} />}
      <NavigationConfigsProvider
        currentProduct={product ?? 'CreatorDashboard'}
        environment={getNavigationEnvironment()}
        robloxEnvironment={process.env.targetEnvironment}
        target={process.env.buildTarget}
        drawerVariant='belowAppBar'
        signalRCrossTab={{
          enabled: settings.enableSignalRCrossTab,
          isFetched: isSettingsFetched,
        }}
        enableGroupModeration={settings.enableGroupModerationPage}>
        {data?.enableIAM2 || usePrimaryInGuestMode ? (
          <CreatorHubLayout
            beta={beta}
            title={title}
            secondaryRail={rail}
            useBreadcrumbs={!noBreadCrumbs}
            secondarySize={secondarySize}
            omitPageTitle={omitPageTitle}>
            {children}
          </CreatorHubLayout>
        ) : (
          <AppNavigationLayout noBreadCrumbs={noBreadCrumbs} {...appNavigationProps}>
            {children}
          </AppNavigationLayout>
        )}
      </NavigationConfigsProvider>
    </React.Fragment>
  );
};

export default IALayoutExperiment;
