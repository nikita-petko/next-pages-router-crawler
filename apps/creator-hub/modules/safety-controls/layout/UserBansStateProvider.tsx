import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useMemo } from 'react';

export enum UserBansState {
  Default = 'default',
  SnackbarSuccess = 'snackbarSuccess',
  SnackbarError = 'snackbarError',
  BanUsersNotFoundDialogError = 'banUsersNotFoundDialogError',
  BanUsersGenericDialogError = 'banUsersGenericDialogError',
  UnbanUsersDialogError = 'unbanUsersDialogError',
}

type UserBansStateContextType = {
  userBansState: UserBansState;
  setUserBansState: (state: UserBansState) => void;
  snackbarMessage: string;
  setSnackbarMessage: (message: string) => void;
  listUserIdsError: string[];
  setListUserIdsError: (userIds: string[]) => void;
};

const UserBansStateContext = createContext<UserBansStateContextType>({
  userBansState: UserBansState.Default,
  setUserBansState: () => {},
  snackbarMessage: '',
  setSnackbarMessage: () => {},
  listUserIdsError: [],
  setListUserIdsError: () => {},
});

export const useUserBansStateContext = () => {
  const context = useContext(UserBansStateContext);
  if (context == null) {
    throw new Error('useUserBansStateContext must be used within a UserBansStateProvider');
  }
  return context;
};

export const UserBansStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userBansState, setUserBansState] = useState<UserBansState>(UserBansState.Default);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [listUserIdsError, setListUserIdsError] = useState<string[]>([]);

  const value = useMemo(
    () => ({
      userBansState,
      setUserBansState,
      snackbarMessage,
      setSnackbarMessage,
      listUserIdsError,
      setListUserIdsError,
    }),
    [
      userBansState,
      setUserBansState,
      snackbarMessage,
      setSnackbarMessage,
      listUserIdsError,
      setListUserIdsError,
    ],
  );

  return <UserBansStateContext.Provider value={value}>{children}</UserBansStateContext.Provider>;
};
