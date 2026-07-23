import React, {
  Dispatch,
  Fragment,
  FunctionComponent,
  ReactElement,
  SetStateAction,
  useCallback,
} from 'react';
import { Menu, MenuLabel, MenuSection, MenuSeparator, TMenuItemProps } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useRobloxAuthentication } from '@rbx/auth';
import { AccountSwitcherSnackbarConfig } from '../../../accountSwitcher';
import useNavigationConfigs from '../../../hooks/useNavigationConfigs';
import {
  clickNavCopyUserIdEventModel,
  clickNavLogOutEventModel,
  clickNavSettingsEventModel,
  clickNavSwitchAccountsEventModel,
} from '../../../event/eventConstants';
import { getCreatorHubBasePathV2 as getCreatorHubBasePath } from '../../../utils/getBasePaths';
import isDashboard from '../../../utils/isDashboard';
import type { TBuildTarget, TProductKey, TRobloxEnvironment } from '../../../types';
import AuthenticationStatusMenuItem from './AuthenticationStatusMenuItem';
import { isRobloxApp } from '../../../accountSwitcher/utils/browser';

// we can't use useProductUrls because devforum doesn't support NextJS routing
const getSettingsHref = (
  currentProduct: TProductKey,
  target: TBuildTarget,
  robloxEnvironment: TRobloxEnvironment,
) => {
  const baseUrl = getCreatorHubBasePath(target, robloxEnvironment);
  const creatorHubBasePath = isDashboard(currentProduct) ? '/' : baseUrl;
  return `${creatorHubBasePath}settings/preferences`;
};

type TAuthenticationStatusMenuProps = {
  desktopDropdownContent?: ReactElement<TMenuItemProps>[];
  isAccountSwitcherFrameLoaded: boolean; // whether the account switcher iframe has loaded. if false, we show a disabled menu item with a loading state. if true, we show the menu item based on whether the account switcher is enabled.
  isAccountSwitcherEnabled: boolean; // whether the account switcher is enabled. This comes from the iframe itself.
  isAccountSwitcherSupported: boolean; // whether the account switcher is supported in the current environment. Determines whether to show the account switcher menu item and whether to load the account switcher iframe.
  onLogout?: VoidFunction; // optional callback that runs after logout
  setIsDialogOpen: (isOpen: boolean) => void;
  setIsLogoutInProgress: Dispatch<SetStateAction<boolean>>;
  setIsPopoverOpen: Dispatch<SetStateAction<boolean>>;
  setSnackbarConfig: Dispatch<SetStateAction<AccountSwitcherSnackbarConfig | undefined>>;
};

const AuthenticationStatusMenu: FunctionComponent<TAuthenticationStatusMenuProps> = ({
  desktopDropdownContent,
  isAccountSwitcherFrameLoaded,
  isAccountSwitcherEnabled,
  isAccountSwitcherSupported,
  onLogout,
  setIsDialogOpen,
  setIsLogoutInProgress,
  setIsPopoverOpen,
  setSnackbarConfig,
}) => {
  const { translate } = useTranslation();
  const { currentProduct, target, robloxEnvironment, sendEvent } = useNavigationConfigs();
  const { logout, user } = useRobloxAuthentication();

  const settingsHref = getSettingsHref(currentProduct, target, robloxEnvironment);

  const onClickSettings = useCallback(() => {
    sendEvent(clickNavSettingsEventModel);
    setTimeout(() => {
      window.open(settingsHref, '_self');
    }, 100);
  }, [sendEvent, settingsHref]);

  const onClickCopyUserId = useCallback(() => {
    if (user?.id) {
      sendEvent(clickNavCopyUserIdEventModel);
      navigator.clipboard.writeText(user.id.toString());
    }
    setSnackbarConfig({ title: translate('Message.UserIdCopied'), isError: false });
    setIsPopoverOpen(false); // there's a bug where the popover doesn't close if there's no href, so we have to close it manually here
  }, [sendEvent, setIsPopoverOpen, setSnackbarConfig, translate, user?.id]);

  const onClickSwitchAccounts = useCallback(() => {
    sendEvent(clickNavSwitchAccountsEventModel);
    setIsDialogOpen(true);
  }, [sendEvent, setIsDialogOpen]);

  const onClickLogout = useCallback(async () => {
    sendEvent(clickNavLogOutEventModel);
    setIsLogoutInProgress(true);
    try {
      await logout();
    } catch {
      // fail silently
    }
    if (onLogout) {
      onLogout();
    }
    setIsLogoutInProgress(false);
  }, [logout, onLogout, sendEvent, setIsLogoutInProgress]);

  const shouldShowLogOut = !isRobloxApp();

  return (
    <Menu size='Medium' className='min-width-[260px]'>
      <MenuSection>
        <MenuLabel title={translate('Label.SignedInAs', { username: user?.name ?? '' })} disabled />
        <AuthenticationStatusMenuItem
          text={translate('Heading.Settings')}
          onSelect={onClickSettings}
          href={settingsHref}
        />
      </MenuSection>
      <MenuSeparator />
      {desktopDropdownContent && desktopDropdownContent.length > 0 && (
        <Fragment>
          <MenuSection>{desktopDropdownContent}</MenuSection>
          <MenuSeparator />
        </Fragment>
      )}
      <MenuSection>
        <AuthenticationStatusMenuItem
          key='CopyUserId'
          text={translate('Action.CopyUserId')}
          onSelect={onClickCopyUserId}
        />
        {isAccountSwitcherSupported &&
        (!isAccountSwitcherFrameLoaded || isAccountSwitcherEnabled) ? ( // if frame is loaded, show only if enabled. otherwise show disabled menu item while loading.
          <AuthenticationStatusMenuItem
            key='SwitchAccounts'
            text={translate('Action.SwitchAccounts')}
            onSelect={onClickSwitchAccounts}
            disabled={!isAccountSwitcherEnabled}
          />
        ) : null}
      </MenuSection>
      {shouldShowLogOut && (
        <Fragment>
          <MenuSeparator />
          <MenuSection>
            <AuthenticationStatusMenuItem
              key='LogOut'
              text={translate('Action.LogOut')}
              onSelect={onClickLogout}
            />
          </MenuSection>
        </Fragment>
      )}
    </Menu>
  );
};

export default AuthenticationStatusMenu;
