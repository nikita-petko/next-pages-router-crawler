import { getCookieValueByKey, device } from '@rbx/core';
import type { TStudioProtocolParamsBase } from '../types';
import { EStudioTaskType, type StudioDialogParams } from '../types';

type TStudioProtocolParams = TStudioProtocolParamsBase & StudioDialogParams;

const CHECKING_STUDIO_DURATION_MILLISECONDS = 3000;

export const waitForStudioCheck = () =>
  new Promise((resolve) => {
    setTimeout(resolve, CHECKING_STUDIO_DURATION_MILLISECONDS);
  });

export const getBrowserTrackerId = (): string => {
  const cookieValue =
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty-string cookie should fall through to the secondary tracker cookie; || is intentional
    getCookieValueByKey('RBXEventTrackerV2') || getCookieValueByKey('RBXEventTracker');
  if (cookieValue) {
    const match = cookieValue.match(/browserid=([^&]*)/i);
    if (match) {
      return match[1] || '';
    }
  }
  return '';
};

export const getStudioProtocolURL = (params: TStudioProtocolParams): string => {
  const protocol = [
    `${params.protocolScheme}:1`,
    `launchtime:${Date.now()}`,
    'avatar',
    `browsertrackerid:${getBrowserTrackerId()}`,
    `robloxLocale:${params.locale}`,
    `gameLocale:${params.locale}`,
    `channel:${params.channel}`,
    `browser:${device.getCurrentBrowser()}`,
    `userId:${params.userId}`,
    `distributorType:${params.distributorType}`,
  ];

  // Web -> Studio auto-login: the magic code is base64url (`[A-Za-z0-9_-]`), so
  // it never contains the `+` or `:` separators and is safe to embed unescaped.
  if (typeof params.authCode !== 'undefined' && params.authCode !== '') {
    protocol.push(`authCode:${params.authCode}`, 'authCodeType:magic');
  }

  if (typeof params.baseUrl !== 'undefined') {
    protocol.push(`baseUrl:${encodeURIComponent(params.baseUrl)}`);
  }

  if (params.task === EStudioTaskType.ViewAsset) {
    protocol.push('launchmode:asset');

    // * (zwang, 09/25/23): note here we don't set the `task` param, and it
    // * spells as `assetid` is also intentional
    protocol.push(`assetid:${params.assetId}`);
  } else {
    protocol.push('launchmode:edit');

    if (params.task === EStudioTaskType.EditPlace) {
      protocol.push(
        `task:${params.task}`,
        `placeId:${params.placeId}`,
        `universeId:${params.universeId}`,
      );
    }

    if (
      params.task === EStudioTaskType.Default ||
      params.task === EStudioTaskType.ReturnFromLogin
    ) {
      protocol.push(`task:${params.task}`);
    }
  }

  return protocol.join('+');
};

export const openStudioProtocol = (protocol: string): void => {
  const oldIframe = document.querySelector('[data-testid="studio-protocol-iframe"]');

  if (oldIframe) {
    oldIframe.remove();
  }

  const newIframe = document.createElement('iframe');
  newIframe.style.display = 'none';
  newIframe.src = protocol;
  newIframe.setAttribute('data-testid', 'studio-protocol-iframe');

  document.body.appendChild(newIframe);
};
