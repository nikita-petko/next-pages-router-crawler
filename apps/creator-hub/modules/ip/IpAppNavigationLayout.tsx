import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import { PageNotFound } from '@modules/miscellaneous/error';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';
import AcksContainer from './common/AcksContainer';
import { ContentLicensingCustomSettingsProvider } from './common/implementations/contentLicensingCustomSettings';
import { AccountProvider } from './components/AccountProvider';
import IpLeftNav from './components/IpLeftNav';
import IpIALeftNav from './components/IpLeftNavIA';

type TIpLayoutContext = {
  setPageTitle: (pageTitle: React.ReactNode) => void;
};
const IpLayoutContext = createContext<TIpLayoutContext>({ setPageTitle: () => {} });

// useIpLayoutContext should be only used in one component at a time due to setPageTitle and unmount logic below
export const useIpLayoutContext = () => {
  const ipLayoutContext = useContext(IpLayoutContext);
  // The `IpAppNavigationLayout` provides a default title that children can override by calling `setPageTitle`.
  // However, since `IpAppNavigationLayout` can persist across pages, we want to reset/undo the title
  // once the child is unmounted, so it doesn't carry over to new pages.
  useEffect(() => {
    return () => {
      ipLayoutContext.setPageTitle(undefined);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- we want to only run this on unmount
  return ipLayoutContext;
};

interface IpAppNavigationLayoutBaseProps {
  children: React.ReactNode;
  /** Default title that will be used unless a child component manually overrides by calling `setPageTitle` from useIpLayoutContext */
  defaultTitle?: string | React.ReactNode;
  requireRightsAccount?: boolean;
  requireAgreementsManager?: boolean;
}

interface IpAppNavigationLayoutAccountNotRequiredProps extends IpAppNavigationLayoutBaseProps {
  requireRightsAccount?: false;
  requireAgreementsManager?: false;
}

interface IpAppNavigationLayoutAccountRequiredProps extends IpAppNavigationLayoutBaseProps {
  requireRightsAccount: true;
}

type IpAppNavigationLayoutProps =
  | IpAppNavigationLayoutAccountNotRequiredProps
  | IpAppNavigationLayoutAccountRequiredProps;

/**
 * App Navigation Layout for items under IP, where we show the secondary IP nav.
 * All pages should have a title. It can be set here for a static variant, or see the
 * `setPageTitle` method that can be used for dynamic titles
 */
const IpAppNavigationLayout = ({
  children,
  defaultTitle,
  requireRightsAccount,
  requireAgreementsManager,
}: IpAppNavigationLayoutProps) => {
  const [pageTitle, setPageTitle] = useState<React.ReactNode | undefined>();
  const value = useMemo(
    () => ({
      setPageTitle,
    }),
    [],
  );

  const displayedTitle = pageTitle ?? defaultTitle;

  if (process.env.buildTarget === 'luobu') {
    return <PageNotFound />;
  }

  return (
    <CreatorHubLayout
      leftNavigationContents={<IpLeftNav />}
      secondaryRail={<IpIALeftNav />}
      secondarySize='small'
      title={displayedTitle}
      noBreadCrumbs>
      <ToolboxServiceApiProvider>
        <IpLayoutContext.Provider value={value}>
          <ContentLicensingCustomSettingsProvider>
            <AccountProvider
              requireAgreementsManager={requireAgreementsManager}
              requireRightsAccount={requireRightsAccount}>
              <AcksContainer />
              {children}
            </AccountProvider>
          </ContentLicensingCustomSettingsProvider>
        </IpLayoutContext.Provider>
      </ToolboxServiceApiProvider>
    </CreatorHubLayout>
  );
};

export default IpAppNavigationLayout;
