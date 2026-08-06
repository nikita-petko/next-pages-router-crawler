import type { FunctionComponent, ReactElement } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { useRobloxAuthentication } from '@rbx/auth';
import type { TMenuItemProps } from '@rbx/foundation-ui';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ProgressCircle,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useSessionStorage } from '@rbx/react-utilities';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar } from '@rbx/ui';
import type {
  AccountSwitcherSnackbarConfig,
  SwitchedAccountUsersStorage,
} from '../../../accountSwitcher';
import {
  AccountSwitcherDialog,
  AccountSwitcherSnackbar,
  SWITCHED_ACCOUNT_USERS_STORAGE_KEY,
  useGetLoggedInUsersMetadata,
  useLoadAccountSwitcherFrame,
} from '../../../accountSwitcher';
import { isDesktopSafari, isIOS, isRobloxApp } from '../../../accountSwitcher/utils/browser';
import { openNavUserMenuButtonEventModel } from '../../../event/eventConstants';
import useNavigationConfigs from '../../../hooks/useNavigationConfigs';
import useGetAuthenticatedUser from '../../../queries/useGetAuthenticatedUser';
import AuthenticationStatusMenu from './AuthenticationStatusMenu';
import RefreshDialog from './RefreshDialog';

enum DialogType {
  None,
  AccountSwitcher,
  Refresh,
}

type TAuthenticationStatusV3Props = {
  desktopDropdownContent?: ReactElement<TMenuItemProps>[];
  onLogout?: VoidFunction; // optional callback that runs after logout
};

const AuthenticationStatusV3: FunctionComponent<TAuthenticationStatusV3Props> = ({
  desktopDropdownContent,
  onLogout,
}) => {
  const { ready: isTranslationReady, translate } = useTranslation();
  const { currentProduct, sendEvent } = useNavigationConfigs();
  const { login, user, isFetched: isUserFetched } = useRobloxAuthentication();
  const { data: authUser, isSuccess: isAuthUserSuccess } = useGetAuthenticatedUser({
    enabled: isUserFetched && user !== null && currentProduct !== 'Forum', // skip check for DevForum since DevForum can have a different auth user
    refetchOnWindowFocus: true,
  });
  const isAccountSwitcherSupported =
    !isRobloxApp() && // account switcher is managed by the Roblox app itself, so we hide it in the app to avoid confusion
    !isIOS() && // WWW on iOS does not support account switching
    !isDesktopSafari(); // Desktop Safari partitions localStorage, which breaks the account switcher, so we hide it to avoid confusion. We can remove this check if Safari supports unpartioned localStorage or redirect to WWW once we have an account switcher landing page.
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [hasMenuEverOpened, setHasMenuEverOpened] = useState<boolean>(false);
  const { isLoaded: isAccountSwitcherFrameLoaded, isEnabled: isAccountSwitcherEnabled } =
    useLoadAccountSwitcherFrame(isAccountSwitcherSupported && hasMenuEverOpened);
  useGetLoggedInUsersMetadata({
    enabled: isAccountSwitcherSupported && isAccountSwitcherFrameLoaded,
  }); // Preload logged in users metadata
  const [snackbarConfig, setSnackbarConfig] = useState<AccountSwitcherSnackbarConfig | undefined>(
    undefined,
  );
  const [dialogType, setDialogType] = useState<DialogType>(DialogType.None);
  const [isLogoutInProgress, setIsLogoutInProgress] = useState<boolean>(false);
  const [switchedAccountUsersStorage, setSwitchedAccountUsersStorage] =
    useSessionStorage<SwitchedAccountUsersStorage | null>(SWITCHED_ACCOUNT_USERS_STORAGE_KEY, null);

  const loading = !isUserFetched || isLogoutInProgress;

  useEffect(() => {
    if (!isUserFetched || !isAuthUserSuccess) {
      return;
    }

    if (user?.id !== authUser?.id) {
      setDialogType(DialogType.Refresh);
    }
  }, [authUser?.id, isAuthUserSuccess, isUserFetched, user?.id]);

  useEffect(() => {
    if (
      !isUserFetched ||
      !isTranslationReady ||
      switchedAccountUsersStorage === null || // no switched account info
      user?.id === switchedAccountUsersStorage?.switchedFromUserId // user is still on page and hasn't switched yet
    ) {
      return;
    }

    if (user?.id === switchedAccountUsersStorage?.switchedToUserId) {
      setSnackbarConfig({
        title: translate('Message.YouSwitchedTo', { username: user.name ?? '' }),
        isError: false,
      });
    }
    setSwitchedAccountUsersStorage(null); // clear storage every time in case data is stale / bad
  }, [
    isTranslationReady,
    isUserFetched,
    setSwitchedAccountUsersStorage,
    switchedAccountUsersStorage,
    translate,
    user?.id,
    user?.name,
  ]);

  const setAccountSwitcherDialogOpen = useCallback((isOpen: boolean) => {
    setDialogType(isOpen ? DialogType.AccountSwitcher : DialogType.None);
  }, []);

  // close popover with Tab key to follow ARIA menubar standards
  const onPopoverKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      setIsPopoverOpen(false);
    }
  }, []);

  const onPopoverOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        sendEvent(openNavUserMenuButtonEventModel);
        setHasMenuEverOpened(true);
      }
      setIsPopoverOpen(isOpen);
    },
    [sendEvent],
  );

  if (loading) {
    return (
      <div className='flex justify-center items-center min-width-1800 min-height-1200'>
        <ProgressCircle ariaLabel='Loading Navigation' variant='Indeterminate' size='Medium' />
      </div>
    );
  }

  if (user === null) {
    return (
      <Button
        size='Large'
        variant='Utility'
        onClick={() => login()}
        className='min-width-1800 min-height-1200'>
        {translate('Action.LogIn')}
      </Button>
    );
  }

  const avatar = (
    <Avatar alt='avatar'>
      <Thumbnail2d
        targetId={user.id ?? 0}
        type={ThumbnailTypes.avatarHeadshot}
        alt={user.name ?? ''}
      />
    </Avatar>
  );

  return (
    <>
      <AccountSwitcherSnackbar config={snackbarConfig} setConfig={setSnackbarConfig} />
      <AccountSwitcherDialog
        isLoaded={isAccountSwitcherFrameLoaded}
        isOpen={dialogType === DialogType.AccountSwitcher}
        setIsOpen={setAccountSwitcherDialogOpen}
        setSnackbarConfig={setSnackbarConfig}
      />
      <RefreshDialog
        isOpen={dialogType === DialogType.Refresh}
        switchedFromUserId={user.id}
        switchedToUserId={authUser?.id}
      />
      <Popover open={isPopoverOpen} onOpenChange={onPopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button size='Large' variant='Utility' className='min-width-1800'>
            {avatar}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side='bottom'
          align='end'
          ariaLabel='Navigation Menu'
          onKeyDown={onPopoverKeyDown}>
          <AuthenticationStatusMenu
            desktopDropdownContent={desktopDropdownContent}
            isAccountSwitcherFrameLoaded={isAccountSwitcherFrameLoaded}
            isAccountSwitcherEnabled={isAccountSwitcherEnabled}
            isAccountSwitcherSupported={isAccountSwitcherSupported}
            onLogout={onLogout}
            setIsDialogOpen={setAccountSwitcherDialogOpen}
            setIsLogoutInProgress={setIsLogoutInProgress}
            setIsPopoverOpen={setIsPopoverOpen}
            setSnackbarConfig={setSnackbarConfig}
          />
        </PopoverContent>
      </Popover>
    </>
  );
};

export default AuthenticationStatusV3;
