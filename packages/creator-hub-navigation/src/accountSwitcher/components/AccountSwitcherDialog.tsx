import React, {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Button,
  clsx,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Divider,
  Icon,
  List,
  ListItem,
  ProgressCircle,
} from '@rbx/foundation-ui';
import { Avatar } from '@rbx/ui';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { useTranslation } from '@rbx/intl';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';
import getProductHref from '../../utils/getProductHref';
import getRobloxSiteDomain from '../../utils/getRobloxSiteDomain';
import { useSwitchAccounts, useGetLoggedInUsersMetadata } from '../AccountSwitcherQueries';
import { AccountSwitcherSnackbarConfig } from './AccountSwitcherSnackbar';
import {
  accountSwitcherDialogImpressionEventModel,
  accountSwitcherGetUsersMetadataFailedEventModel,
  clickAccountSwitcherAddAccountEventModel,
  clickSwitchAccountsButtonEventModel,
} from '../../event/eventConstants';

const ACCOUNT_SWITCHER_LIMIT = 5;

type AccountSwitcherDialogProps = {
  isLoaded: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setSnackbarConfig: Dispatch<SetStateAction<AccountSwitcherSnackbarConfig | undefined>>;
};

const AccountSwitcherDialog: FunctionComponent<AccountSwitcherDialogProps> = ({
  isLoaded,
  isOpen,
  setIsOpen,
  setSnackbarConfig,
}) => {
  const { translate } = useTranslation();
  const { currentProduct, target, environment, sendEvent } = useNavigationConfigs();
  const {
    mutate: switchAccountsMutate,
    isPending: isSwitchAccountsPending,
    isSuccess: isSwitchAccountsSuccess,
    variables: switchAccountsVariables,
  } = useSwitchAccounts(setIsOpen, setSnackbarConfig);
  const {
    data: loggedInUsersMetadata,
    isSuccess: isLoggedInUsersMetadataSuccess,
    error: loggedInUsersMetadataError,
  } = useGetLoggedInUsersMetadata({ enabled: isLoaded && isOpen });
  const [isAddAccountButtonLoading, setIsAddAccountButtonLoading] = useState(false);

  const isSwitchAccountsInProgress = isSwitchAccountsPending || isSwitchAccountsSuccess;
  const addAccountLink = `https://www.${getRobloxSiteDomain(target, environment)}/login?returnUrl=${encodeURIComponent(getProductHref(currentProduct, window.location.origin))}`;
  const userIdsViewedCsv = // used for analytics
    loggedInUsersMetadata?.loggedInUsersMetadata
      ?.map((user) => user.userId)
      .sort((a, b) => Number(a ?? 0) - Number(b ?? 0)) // sort so the order is consistent
      .join(',') ?? '';

  useEffect(() => {
    if (isOpen && loggedInUsersMetadataError) {
      sendEvent(
        accountSwitcherGetUsersMetadataFailedEventModel({
          error: loggedInUsersMetadataError.toString(),
        }),
      );
      setSnackbarConfig({
        title: translate('Message.AccountSwitchFailed'),
        isError: true,
      });
      setIsOpen(false);
    }
  }, [isOpen, loggedInUsersMetadataError, sendEvent, setIsOpen, setSnackbarConfig, translate]);

  useEffect(() => {
    if (isOpen && isLoggedInUsersMetadataSuccess) {
      sendEvent(accountSwitcherDialogImpressionEventModel({ userIdsViewedCsv }));
    }
  }, [isLoggedInUsersMetadataSuccess, isOpen, sendEvent, userIdsViewedCsv]);

  useEffect(() => {
    if (!isOpen) {
      setIsAddAccountButtonLoading(false);
    }
  }, [isOpen]);

  const onClickSwitchAccounts = useCallback(
    (switchedToUserId: number) => {
      sendEvent(
        clickSwitchAccountsButtonEventModel({
          switchedFromUserId: loggedInUsersMetadata?.activeUserId?.toString() ?? '',
          switchedToUserId: switchedToUserId.toString(),
          userIdsViewedCsv,
        }),
      );
      switchAccountsMutate({
        switchedFromUserId: loggedInUsersMetadata?.activeUserId,
        switchedToUserId: switchedToUserId.toString(),
      });
    },
    [loggedInUsersMetadata?.activeUserId, sendEvent, switchAccountsMutate, userIdsViewedCsv],
  );

  const onClickAddAccount = useCallback(() => {
    setIsAddAccountButtonLoading(true);
    sendEvent(clickAccountSwitcherAddAccountEventModel({ userIdsViewedCsv }));
    setTimeout(() => {
      window.open(addAccountLink, '_self');
    }, 100);
  }, [addAccountLink, sendEvent, userIdsViewedCsv]);

  const getTrailingIcon = useCallback(
    (userId: string) => {
      if (loggedInUsersMetadata?.activeUserId === userId) {
        return (
          <Icon
            name='icon-filled-circle-check'
            size='Medium'
            className='content-emphasis outline-none'
            data-testid='active-user-icon'
          />
        );
      }
      if (isSwitchAccountsInProgress && switchAccountsVariables?.switchedToUserId === userId) {
        return (
          <div className='flex justify-center items-center min-width-500 min-height-500'>
            <ProgressCircle
              ariaLabel='Switching Accounts'
              variant='Indeterminate'
              size='Small'
              data-testid='loading-switch-accounts'
            />
          </div>
        );
      }
      return undefined;
    },
    [
      isSwitchAccountsInProgress,
      loggedInUsersMetadata?.activeUserId,
      switchAccountsVariables?.switchedToUserId,
    ],
  );

  const sortedUsersMetadata = useMemo(() => {
    const users = loggedInUsersMetadata?.loggedInUsersMetadata ?? [];
    const activeUserId = loggedInUsersMetadata?.activeUserId;
    return [...users].sort((a, b) => {
      if (a.userId === activeUserId) {
        return -1;
      }
      if (b.userId === activeUserId) {
        return 1;
      }
      // Sort remaining alphabetically by username
      return (a.username ?? '').localeCompare(b.username ?? '');
    });
  }, [loggedInUsersMetadata?.loggedInUsersMetadata, loggedInUsersMetadata?.activeUserId]);

  const isDialogLoading = !isLoggedInUsersMetadataSuccess || !isLoaded;
  const isAccountLimitReached =
    (loggedInUsersMetadata?.loggedInUsersMetadata?.length ?? 0) >= ACCOUNT_SWITCHER_LIMIT;
  const isAddAccountButtonDisabled =
    isSwitchAccountsInProgress ||
    isAccountLimitReached ||
    isDialogLoading ||
    isAddAccountButtonLoading;

  return (
    <Dialog
      isModal
      open={isOpen}
      size='Medium'
      hasCloseAffordance
      closeLabel='Close'
      hasMarginBottom={false}
      hasMarginTop={false}
      onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogTitle className='flex items-center text-heading-large padding-x-xlarge margin-none padding-top-medium min-height-1800'>
          {translate('Heading.SwitchAccounts')}
        </DialogTitle>
        <DialogBody className='!padding-x-none flex flex-col medium:min-width-[480px]'>
          {isDialogLoading ? (
            <div className='fill flex justify-center items-center min-height-1800'>
              <ProgressCircle
                ariaLabel='Loading Account Switcher'
                variant='Indeterminate'
                size='Medium'
              />
            </div>
          ) : (
            <List>
              {sortedUsersMetadata.map((metadata) => {
                return (
                  <ListItem
                    isContained
                    divider='None'
                    key={metadata.userId}
                    onSelect={
                      loggedInUsersMetadata?.activeUserId === metadata.userId
                        ? undefined
                        : () => onClickSwitchAccounts(Number(metadata.userId))
                    }
                    leading={
                      <Avatar
                        alt={metadata.displayName || 'avatar'}
                        className='min-width-1200 min-height-1200'>
                        <Thumbnail2d
                          targetId={Number(metadata.userId) ?? 0}
                          type={ThumbnailTypes.avatarHeadshot}
                          alt={metadata.displayName || 'avatar'}
                        />
                      </Avatar>
                    }
                    trailing={getTrailingIcon(metadata.userId ?? '')}
                    title={metadata.displayName}
                    text={`@${metadata.username}`}
                    className={clsx(
                      'padding-x-xlarge',
                      isSwitchAccountsInProgress && 'pointer-events-none',
                    )}
                  />
                );
              })}
            </List>
          )}
        </DialogBody>
        {isAccountLimitReached && <Divider />}
        <DialogFooter className='flex flex-col padding-top-xlarge gap-medium'>
          {isAccountLimitReached && (
            <div className='text-caption-medium'>{translate('Message.AccountLimitReached')}</div>
          )}
          <Button
            as='a'
            isDisabled={isAddAccountButtonDisabled}
            variant='Standard'
            href={addAccountLink}
            onClick={isAddAccountButtonDisabled ? undefined : onClickAddAccount}
            className='fill'
            data-testid='add-account-button'>
            {translate('Action.AddAccount')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountSwitcherDialog;
