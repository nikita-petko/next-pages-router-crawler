import { useEffect, useState } from 'react';
import useNavigationConfigs from '../hooks/useNavigationConfigs';
import { TBuildTarget, TTargetEnvironment } from '../types';
import getRobloxSiteDomain from '../utils/getRobloxSiteDomain';
import {
  DATA_FROM_ACCOUNT_SWITCHER_FRAME,
  EventResponse,
  IframeRequest,
  IframeRequestMsg,
  IframeResponse,
  IframeResponseType,
  RBXASBlob,
  RBXASBlobSynced,
} from './constants/iframeTypes';
import { withTimeout } from './utils/withTimeout';

const constructAccountSwitcherFrame = (
  target: TBuildTarget,
  environment: TTargetEnvironment,
): HTMLIFrameElement => {
  const iframe: HTMLIFrameElement = document.createElement('iframe');
  iframe.id = 'account-switcher-frame';
  iframe.style.cssText = 'position: fixed; top: 0; left: 0; width: 0; height: 0; border: none;';
  iframe.src = `https://www.${getRobloxSiteDomain(target, environment)}/account-switcher/iframe`;
  iframe.sandbox = 'allow-scripts allow-same-origin allow-popups';
  return iframe;
};

const appendFrameToDOM = (accountSwitcherFrame: HTMLIFrameElement): HTMLIFrameElement | null => {
  if (document?.body) {
    return document.body.appendChild(accountSwitcherFrame);
  }
  return null;
};

type GetOrCreateFrameResult = {
  accountSwitcherFrame: HTMLIFrameElement | null;
  wasCreated: boolean;
};

const getOrCreateAccountSwitcherFrame = (
  target: TBuildTarget,
  environment: TTargetEnvironment,
): GetOrCreateFrameResult => {
  if (document) {
    let accountSwitcherFrame = document.getElementById(
      'account-switcher-frame',
    ) as HTMLIFrameElement | null;
    if (accountSwitcherFrame === null) {
      accountSwitcherFrame = appendFrameToDOM(constructAccountSwitcherFrame(target, environment));
      return {
        accountSwitcherFrame,
        wasCreated: true,
      };
    }
    return {
      accountSwitcherFrame,
      wasCreated: false,
    };
  }
  return {
    accountSwitcherFrame: null,
    wasCreated: false,
  };
};

function postMessage<T extends IframeRequest['msg']>(
  accountSwitcherFrame: HTMLIFrameElement | null,
  target: TBuildTarget,
  environment: TTargetEnvironment,
  message: Extract<IframeRequest, { msg: T }>,
): void {
  accountSwitcherFrame?.contentWindow?.postMessage(
    message,
    `https://www.${getRobloxSiteDomain(target, environment)}`,
  );
}

function addMessageListener<T extends IframeResponse['type']>(
  eventType: T,
  callback: (
    data: Extract<IframeResponse, { type: T }>,
    self: (event: MessageEvent<EventResponse>) => void,
  ) => void,
): (event: MessageEvent<EventResponse>) => void {
  const listener = (event: MessageEvent<EventResponse>) => {
    const eventData = event.data;

    if (eventData?.msg === DATA_FROM_ACCOUNT_SWITCHER_FRAME) {
      const accountSwitcherData = eventData.data;
      if (accountSwitcherData?.type === eventType) {
        callback(accountSwitcherData as Extract<IframeResponse, { type: T }>, listener); // add listener as second arg so it can be removed inside callback
      }
    }
  };

  window.addEventListener('message', listener);
  return listener;
}

export function useLoadAccountSwitcherFrame(isSupported: boolean) {
  const { target, environment } = useNavigationConfigs();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    addMessageListener(IframeResponseType.Loaded, ({ enabled }, self) => {
      setIsLoaded(true);
      setIsEnabled(enabled);
      window.removeEventListener('message', self);
    });

    const { accountSwitcherFrame, wasCreated } = getOrCreateAccountSwitcherFrame(
      target,
      environment,
    );

    // implicitly if wasCreated is true, iframe will automatically post a message when it finishes loading
    if (!wasCreated) {
      postMessage(accountSwitcherFrame, target, environment, { msg: IframeRequestMsg.CheckLoaded });
    }
  }, [isSupported, target, environment]);

  return {
    isLoaded,
    isEnabled,
  };
}

/**
 * Basic check to see if frame is 'ready'. We assume the frame is ready if it exists already.
 * Otherwise, we recreate the frame and only consider it ready after receiving a loaded response
 */
async function checkAccountSwitcherFrameReady(
  target: TBuildTarget,
  environment: TTargetEnvironment,
): Promise<HTMLIFrameElement | null> {
  const { accountSwitcherFrame, wasCreated } = getOrCreateAccountSwitcherFrame(target, environment);
  if (!wasCreated) {
    // assume that frame is already loaded
    return Promise.resolve(accountSwitcherFrame);
  }

  return withTimeout<HTMLIFrameElement | null>(
    'checkAccountSwitcherFrameReady',
    ({ onSuccess, onTimeout }) => {
      const listener = addMessageListener(IframeResponseType.Loaded, (data, self) => {
        window.removeEventListener('message', self);
        onSuccess(accountSwitcherFrame);
      });
      onTimeout(() => {
        window.removeEventListener('message', listener);
      });
      postMessage(accountSwitcherFrame, target, environment, { msg: IframeRequestMsg.CheckLoaded });
    },
  );
}

export async function readRBXASBlob(target: TBuildTarget, environment: TTargetEnvironment) {
  const accountSwitcherFrame = await checkAccountSwitcherFrameReady(target, environment);

  return withTimeout<string>('readRBXASBlob', ({ onSuccess, onTimeout }) => {
    const listener = addMessageListener(IframeResponseType.LocalStorageValue, (data, self) => {
      if (data.key === RBXASBlob) {
        const sanitizedValue =
          data.value !== null
            ? data.value.replace(/"/g, '') // value inside localStorage is wrapped with quotes
            : ''; // if value is null, treat it as empty string to handle gracefully
        window.removeEventListener('message', self);
        onSuccess(sanitizedValue);
      }
    });
    onTimeout(() => {
      window.removeEventListener('message', listener);
    });
    postMessage(accountSwitcherFrame, target, environment, {
      msg: IframeRequestMsg.ReadLocalStorage,
      key: RBXASBlob,
    });
  });
}

export async function syncRBXASBlob(
  target: TBuildTarget,
  environment: TTargetEnvironment,
  encryptedUsersDataBlob: string,
) {
  const accountSwitcherFrame = await checkAccountSwitcherFrameReady(target, environment);

  return withTimeout<void>('syncRBXASBlob', ({ onSuccess, onTimeout }) => {
    let rbxAsBlobAck = false;
    let rbxAsBlobSyncedAck = false;

    const listener = addMessageListener(
      IframeResponseType.SetLocalStorageValueAck,
      (data, self) => {
        if (data.key === RBXASBlob) {
          rbxAsBlobAck = true;
        } else if (data.key === RBXASBlobSynced) {
          rbxAsBlobSyncedAck = true;
        }
        if (rbxAsBlobAck && rbxAsBlobSyncedAck) {
          window.removeEventListener('message', self);
          onSuccess();
        }
      },
    );
    onTimeout(() => {
      window.removeEventListener('message', listener);
    });

    postMessage(accountSwitcherFrame, target, environment, {
      msg: IframeRequestMsg.SetLocalStorage,
      key: RBXASBlob,
      value: `"${encryptedUsersDataBlob}"`,
    });
    postMessage(accountSwitcherFrame, target, environment, {
      msg: IframeRequestMsg.SetLocalStorage,
      key: RBXASBlobSynced,
      value: 'true',
    });
  });
}
