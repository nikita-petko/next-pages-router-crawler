import type { PropsWithChildren, ReactNode } from 'react';
import React from 'react';
import { HubMeta } from '@rbx/creator-hub-history';
import type { TProductKey } from '@rbx/creator-hub-navigation';
import { NavigationConfigsProvider } from '@rbx/creator-hub-navigation';
import { Translate, useTranslation } from '@rbx/intl';
import type { TranslateProps } from '@rbx/intl';
import { NoSSR } from '@rbx/ui';
import getNavigationEnvironment from '@modules/navigation/utils/getNavigationEnvironment';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import type { TCreatorHubLayoutInnerProps } from './CreatorHubLayoutInner';
import CreatorHubLayoutInner from './CreatorHubLayoutInner';

type AppNavigationProps = {
  disableLeftNavigation?: boolean;
  leftNavigationContents?: ReactNode;
  noBreadCrumbs?: boolean;
  usePublicFooter?: boolean;
};

type CreatorHubLayoutProps = TCreatorHubLayoutInnerProps &
  AppNavigationProps & { product?: TProductKey };

const CreatorHubLayout: React.FC<PropsWithChildren<CreatorHubLayoutProps>> = ({
  product,
  children,
  beta,
  title,
  secondarySize = 'large',
  secondaryRail,
  pageBanner,
  omitPageTitle,
  ...appNavigationProps
}) => {
  const { noBreadCrumbs, leftNavigationContents } = appNavigationProps;
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const { translate } = useTranslation();

  const translatedTitle =
    typeof title === 'string'
      ? translate(title)
      : React.isValidElement<TranslateProps>(title) && title.type === Translate
        ? translate(title.props.translationKey, title.props.args)
        : undefined;
  const rail = secondaryRail ?? leftNavigationContents;

  return (
    <NoSSR>
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
        <CreatorHubLayoutInner
          beta={beta}
          title={title}
          secondaryRail={rail}
          pageBanner={pageBanner}
          useBreadcrumbs={!noBreadCrumbs}
          secondarySize={secondarySize}
          omitPageTitle={omitPageTitle}>
          {children}
        </CreatorHubLayoutInner>
      </NavigationConfigsProvider>
    </NoSSR>
  );
};

export default CreatorHubLayout;
