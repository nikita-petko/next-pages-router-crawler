import { Locale, useLocalization } from '@rbx/intl';
import {
  createStudioResources,
  EStudioTaskType,
  StudioResourcesProvider,
  useStudio as useRbxStudio,
} from '@rbx/studio';
import { captureException } from '@sentry/nextjs';

import { channelClient } from '@clients/channel';
import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useUserSession from '@hooks/useUserSession';

import {
  getStudioBinaryType,
  getStudioDistributorType,
  getStudioProtocolScheme,
} from './studioHelpers';

// * NOTE(@zwang, 01/23/26): reference implementation based on: https://github.rbx.com/Roblox/creator-hub/tree/master/apps/creator-hub/modules/miscellaneous/hooks/useStudio
export const CHECKING_STUDIO_DURATION_MILLISECONDS = 3000;

type TUseRbxStudioParameters = Parameters<typeof useRbxStudio>;
const useStudio = (translations?: TUseRbxStudioParameters[0]) => {
  const { authenticatedUser: user } = useUserSession();
  const { locale } = useLocalization();
  const { translate } = useNamespacedTranslation(TranslationNamespace.Creations);

  const dialogEventHandlers: TUseRbxStudioParameters[1] = {
    download: (_params, helpers?: { getDownloadCode: () => Promise<string | undefined> }) => {
      if (helpers?.getDownloadCode) {
        helpers
          .getDownloadCode()
          .then((downloadCode: string | undefined) => {
            if (downloadCode !== undefined) {
              unifiedLogger.logClickEvent({
                eventName: EventName.DownloadStudio,
                parameters: {
                  downloadCode,
                  logic: 'openOrDownload',
                  referralUrl: document.referrer,
                },
              });
            } else {
              unifiedLogger.logClickEvent({
                eventName: EventName.DownloadStudio,
                parameters: {
                  downloadCode: '',
                  logic: 'openOrDownload',
                  referralUrl: document.referrer,
                },
              });
            }
          })
          .catch(() => {
            // Fallback if promise rejects
            unifiedLogger.logClickEvent({
              eventName: EventName.DownloadStudio,
              parameters: {
                downloadCode: '',
                logic: 'openOrDownload',
                referralUrl: document.referrer,
              },
            });
          });
      } else {
        // No getDownloadCode helper available
        unifiedLogger.logClickEvent({
          eventName: EventName.DownloadStudio,
          parameters: {
            downloadCode: '',
            logic: 'openOrDownload',
            referralUrl: document.referrer,
          },
        });
      }
    },
    startAttempt: (params) => {
      unifiedLogger.logClickEvent({
        eventName: EventName.StudioStartAttempt,
        parameters: {
          referralUrl: document.referrer,
          task: params.task.toLowerCase(),
        },
      });
    },
    startSuccess: (params) => {
      unifiedLogger.logClickEvent({
        eventName: EventName.StudioStartSuccess,
        parameters: {
          referralUrl: document.referrer,
          task: params.task.toLowerCase(),
        },
      });
    },
  };

  // default namespace is TranslationNamespace.Creations
  const defaultTranslations: TUseRbxStudioParameters[0] = {
    'Action.DownloadStudio': translate('Action.DownloadStudio'),
    'Message.CheckingStudio': translate('Message.CheckingStudio'),
    'Message.OpenStudioError': translate('Message.OpenStudioError'),
    'Message.StartYourCreation': translate('Message.StartYourCreation'),
  };

  const { dialog, getStudioDownloadUrlAsync, isCompatible, open } = useRbxStudio(
    translations ?? defaultTranslations,
    dialogEventHandlers,
  );

  type TOpenParameters = Parameters<typeof open>;

  return {
    dialog,
    getStudioDownloadUrlAsync,
    isCompatible,
    open: (params: TOpenParameters[0]) => {
      const context: TOpenParameters[1] = {
        distributorType: getStudioDistributorType(),
        locale: locale || Locale.English,
        protocolScheme: getStudioProtocolScheme(),
        userId: user?.id,
      };
      return open(params, context);
    },
  };
};

function getEnvironment() {
  switch (process.env.environment) {
    case 'production':
      return 'production';
    case 'staging':
      return 'sitetest1';
    default:
      return 'sitetest3';
  }
}

// * NOTE(@zwang, 01/23/26): at this time it seems only Dark theme is supported
const studioResources = createStudioResources({
  environment: getEnvironment(),
  errorHandler: (error: Error) => captureException(error),
  fetchers: {
    userChannel: async () =>
      (await channelClient.getUserChannel(getStudioBinaryType())).channelName,
  },
  logoSrc: `https://cdn.foundation.${process.env.robloxSiteDomain}/current/StudioLogo-Dark.svg`,
  target: 'global',
});

export type TStudioResources = ReturnType<typeof createStudioResources>;
export { StudioResourcesProvider, studioResources, EStudioTaskType };
export default useStudio;
