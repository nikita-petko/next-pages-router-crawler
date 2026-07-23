import { captureException } from '@sentry/nextjs';
import { type PropsWithChildren, useMemo, useState, useCallback, Fragment } from 'react';
import { useLocalization, Locale, useTranslation } from '@rbx/intl';
import { useThemeMode, type ThemeMode } from '@rbx/settings';
import {
  EStudioTaskType,
  StudioResourcesProvider,
  createStudioResources,
  useStudio as useRbxStudio,
} from '@rbx/studio';
import { useAuthentication } from '@modules/authentication/providers';
import { channelClient } from '@modules/clients/clientsettings';
import {
  studioStartAttemptEventModel,
  studioStartSuccessEventModel,
  downloadStudioOpenOrDownloadEventModel,
} from '@modules/eventStream/constants/eventConstants';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { FeatureFlagName } from '@modules/settings/SettingsProvider/featureFlags';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import ExperienceLockedDialog from '../components/ExperienceLockedDialog';
import checkPlaceModerationForEdit from '../utils/checkPlaceModerationForEdit';
import {
  getStudioBinaryType,
  getStudioProtocolScheme,
  getStudioDistributorType,
} from './studioHelpers';

export const CHECKING_STUDIO_DURATION_MILLISECONDS = 3000;

type TUseRbxStudioParameters = Parameters<typeof useRbxStudio>;
const useStudio = (translations?: TUseRbxStudioParameters[0]) => {
  const { user } = useAuthentication();
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const { settings } = useSettings();
  const { trackerClient } = useEventTrackerProvider();

  const dialogEventHandlers: TUseRbxStudioParameters[1] = {
    startAttempt: (params) => trackerClient.sendEvent(studioStartAttemptEventModel(params.task)),
    startSuccess: (params) => trackerClient.sendEvent(studioStartSuccessEventModel(params.task)),
    download: (_params, helpers?: { getDownloadCode: () => Promise<string | undefined> }) => {
      if (helpers?.getDownloadCode) {
        helpers
          .getDownloadCode()
          .then((downloadCode: string | undefined) => {
            if (downloadCode !== undefined) {
              trackerClient.sendEvent(downloadStudioOpenOrDownloadEventModel(downloadCode));
            } else {
              trackerClient.sendEvent(downloadStudioOpenOrDownloadEventModel());
            }
          })
          .catch(() => {
            // Fallback if promise rejects
            trackerClient.sendEvent(downloadStudioOpenOrDownloadEventModel());
          });
      } else {
        // No getDownloadCode helper available
        trackerClient.sendEvent(downloadStudioOpenOrDownloadEventModel());
      }
    },
  };

  // default namespace is TranslationNamespace.Creations, which is already included in any page using AppLayout
  const defaultTranslations: TUseRbxStudioParameters[0] = {
    'Action.DownloadStudio': translate('Action.DownloadStudio'),
    'Message.CheckingStudio': translate('Message.CheckingStudio'),
    'Message.OpenStudioError': translate('Message.OpenStudioError'),
    'Message.StartYourCreation': translate('Message.StartYourCreation'),
  };

  const { isCompatible, open, dialog, getStudioDownloadUrlAsync } = useRbxStudio(
    translations ?? defaultTranslations,
    dialogEventHandlers,
  );

  const [experienceLockedDialogOpen, setExperienceLockedDialogOpen] = useState(false);
  const closeExperienceLockedDialog = useCallback(() => setExperienceLockedDialogOpen(false), []);

  type TOpenParameters = Parameters<typeof open>;
  const openWithContext = useCallback(
    (params: TOpenParameters[0], context: TOpenParameters[1]) => open(params, context),
    [open],
  );

  const openSync = useCallback(
    (params: TOpenParameters[0]) => {
      const context: TOpenParameters[1] = {
        userId: user?.id,
        locale: locale || Locale.English,
        protocolScheme: getStudioProtocolScheme(),
        distributorType: getStudioDistributorType(),
      };

      const openAsync = async () => {
        if (
          params.task === EStudioTaskType.EditPlace &&
          settings[FeatureFlagName.enablePlaceModerationCheckBeforeStudioOpen]
        ) {
          try {
            const allowed = await checkPlaceModerationForEdit(params.universeId, params.placeId);
            if (!allowed) {
              setExperienceLockedDialogOpen(true);
              return;
            }
          } catch {
            // On network or other failure, let Studio launch proceed (no snackbar).
          }
        }

        openWithContext(params, context);
      };

      openAsync().catch(() => {
        // Fire-and-forget: on failure (e.g. network), Studio launch is not attempted.
      });
    },
    [user?.id, locale, openWithContext, settings],
  );

  return {
    isCompatible,
    open: openSync,
    dialog: (
      <>
        {dialog}
        <ExperienceLockedDialog
          open={experienceLockedDialogOpen}
          onClose={closeExperienceLockedDialog}
        />
      </>
    ),
    getStudioDownloadUrlAsync,
  };
};

const studioLogoSrcByThemeMode: Record<ThemeMode, string> = {
  light: `https://cdn.foundation.${process.env.robloxSiteDomain}/current/StudioLogo-Light.svg`,
  dark: `https://cdn.foundation.${process.env.robloxSiteDomain}/current/StudioLogo-Dark.svg`,
};

function ThemeAwareStudioResourcesProvider({ children }: PropsWithChildren) {
  const { themeMode } = useThemeMode();
  const studioResources = useMemo(
    () =>
      createStudioResources({
        logoSrc: studioLogoSrcByThemeMode[themeMode],
        target: process.env.buildTarget,
        environment: process.env.targetEnvironment,
        fetchers: {
          userChannel: async () =>
            (await channelClient.getUserChannel(getStudioBinaryType())).channelName,
        },
        errorHandler: (error: Error) => captureException(error),
      }),
    [themeMode],
  );
  return <StudioResourcesProvider resources={studioResources}>{children}</StudioResourcesProvider>;
}

export type TStudioResources = ReturnType<typeof createStudioResources>;
export { ThemeAwareStudioResourcesProvider, EStudioTaskType };
export default useStudio;
