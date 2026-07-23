// Use GetInitialRequestState together with RequestStateType to create a new state object with the initial values.
export interface RequestStateType<T> {
  data: T;
  isError: boolean;
  isLoading: boolean;
}

export const GetInitialRequestState = <T>(initialValue: T) => ({
  data: initialValue,
  isError: false,
  isLoading: true,
});

// Use GetEmptyRequestState to create a new state object without the initial values and it will be defaulted to undefined.
export interface EmptyRequestStateType<T> {
  data: T | undefined;
  isError: boolean;
  isLoading: boolean;
}

export interface EmptyRequestStateWithErrorType<T> extends EmptyRequestStateType<T> {
  errorCode?: string;
  errorStatus?: number;
}

export const GetEmptyRequestState = <T>(): RequestStateType<T | undefined> => ({
  data: undefined,
  isError: false,
  isLoading: true,
});
