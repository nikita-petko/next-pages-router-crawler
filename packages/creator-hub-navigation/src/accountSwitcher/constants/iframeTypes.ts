export const RBXASBlob = 'RBXASBlob' as const;
export const RBXASBlobSynced = 'RBXASBlobSynced' as const;
export const DATA_FROM_ACCOUNT_SWITCHER_FRAME = 'dataFromAccountSwitcherFrame' as const;

export enum IframeRequestMsg {
  CheckLoaded = 'checkLoadedRequest',
  ReadLocalStorage = 'readLocalStorageRequest',
  SetLocalStorage = 'setLocalStorageRequest',
}

export enum IframeResponseType {
  Loaded = 'loaded',
  LocalStorageValue = 'localStorageValue',
  SetLocalStorageValueAck = 'setLocalStorageValueAck',
}

type LoadedRequest = {
  msg: IframeRequestMsg.CheckLoaded;
};
type ReadLocalStorageRequest = {
  msg: IframeRequestMsg.ReadLocalStorage;
  key: string;
};
type SetLocalStorageRequest = {
  msg: IframeRequestMsg.SetLocalStorage;
  key: string;
  value: string;
};
export type IframeRequest = LoadedRequest | ReadLocalStorageRequest | SetLocalStorageRequest;

type LoadedResponse = {
  type: IframeResponseType.Loaded;
  enabled: boolean;
};
type LocalStorageValueResponse = {
  type: IframeResponseType.LocalStorageValue;
  key: string;
  value: string;
};
type SetLocalStorageValueAckResponse = {
  type: IframeResponseType.SetLocalStorageValueAck;
  key: string;
  value: string;
};
export type IframeResponse =
  | LoadedResponse
  | LocalStorageValueResponse
  | SetLocalStorageValueAckResponse;
export type EventResponse = {
  msg: typeof DATA_FROM_ACCOUNT_SWITCHER_FRAME;
  data: IframeResponse;
};
