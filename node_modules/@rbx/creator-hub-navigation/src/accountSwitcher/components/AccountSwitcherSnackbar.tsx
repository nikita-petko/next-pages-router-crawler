import type { Dispatch, FunctionComponent, SetStateAction } from 'react';
import React from 'react';
import { Snackbar } from '@rbx/foundation-ui';

export type AccountSwitcherSnackbarConfig = {
  title: string;
  isError: boolean;
};

type AccountSwitcherSnackbarProps = {
  setConfig: Dispatch<SetStateAction<AccountSwitcherSnackbarConfig | undefined>>;
  config: AccountSwitcherSnackbarConfig | undefined;
};

const AccountSwitcherSnackbar: FunctionComponent<AccountSwitcherSnackbarProps> = ({
  config,
  setConfig,
}) => {
  if (config === undefined) {
    return null;
  }
  const { title, isError } = config;

  return (
    <Snackbar
      shouldAutoDismiss
      icon={isError ? 'icon-regular-triangle-exclamation' : undefined}
      onClose={() => setConfig(undefined)}
      title={title}
    />
  );
};

export default AccountSwitcherSnackbar;
