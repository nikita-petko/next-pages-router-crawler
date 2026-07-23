import atfsApiClient from '@modules/clients/assetTextFilterSettings';
import {
  getUniverseChatUniverseSettings,
  updateUniverseChatUniverseSettings,
} from '@modules/clients/universeChatApi';
import { getResponseFromError } from '@modules/clients/utils';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/common/components/EmptyGrid';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, useSnackbar } from '@rbx/ui';
import { useRouter } from 'next/router';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import AtfsCommunicationSetting from './AtfsCommunicationSetting';
import CommunicationSettingsForm from './CommunicationSettingsForm';

const CommunicationSettingsContainer: FunctionComponent = () => {
  const [onSave, setOnSave] = useState(false);
  const router = useRouter();
  const universeId = router.query.id as string;
  const universeIdNumber = parseInt(universeId, 10);
  const { translate } = useTranslation();
  const [isPageReady, setIsPageReady] = useState<boolean>(false);
  const [communicationSetting, setCommunicationSetting] = useState<AtfsCommunicationSetting>();
  const [isGetCommunicationSettingFailed, setIsGetCommunicationSettingFailed] =
    useState<boolean>(false);
  const [showCrossServerChatSetting, setShowCrossServerChatSetting] = useState(false);
  const [crossServerChatEnabled, setCrossServerChatEnabled] = useState<boolean | undefined>(
    undefined,
  );
  const { enqueue, close } = useSnackbar();

  const showBottomToast = useCallback(
    (msg: string) => {
      enqueue({
        message: msg,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: close,
      });
    },
    [enqueue, close],
  );

  const putCommunicationSettings = useCallback(
    async (desiredCommunicationSetting: AtfsCommunicationSetting) => {
      try {
        const result = await atfsApiClient.putUniverseSettings(
          universeId,
          'Profanity',
          desiredCommunicationSetting.optedOut,
        );
        if (result) {
          setCommunicationSetting({
            category: result.category ?? '',
            optedOut: result.optedOut ?? false,
          });
          setOnSave(true);
          showBottomToast(translate('Message.ConfigureExperienceSuccess'));
        }
      } catch (e) {
        const erroredResponse = getResponseFromError(e);
        const message = await erroredResponse?.json();

        if (message?.error === 'Error universe age recommendation is not 17+.') {
          showBottomToast(translate('Message.ConfigureExperienceFailAgeGuidelinesNotMet'));
        } else {
          showBottomToast(translate('Error.Unknown'));
        }
      } finally {
        setOnSave(false);
      }
    },
    [showBottomToast, translate, universeId],
  );

  const getCommunicationSettings = useCallback(async () => {
    setIsGetCommunicationSettingFailed(false);
    try {
      const atfsResponse = await atfsApiClient.getUniverseSettings(universeId);
      const resultCommunicationSetting: AtfsCommunicationSetting = {
        category: 'Profanity',
        optedOut: atfsResponse.Profanity,
      };
      setCommunicationSetting(resultCommunicationSetting);

      const universeChatResponse = await getUniverseChatUniverseSettings(universeId).catch(
        () => null,
      );
      const showUi = universeChatResponse?.isEligibleToSeeGlobalChatSetting === true;
      setShowCrossServerChatSetting(showUi);
      if (showUi && universeChatResponse) {
        setCrossServerChatEnabled(universeChatResponse.globalChatStatus === 'Enabled');
      } else {
        setCrossServerChatEnabled(undefined);
      }
    } catch {
      setIsGetCommunicationSettingFailed(true);
    } finally {
      setIsPageReady(true);
    }
  }, [universeId]);

  const saveCrossServerChat = useCallback(
    async (enabled: boolean) => {
      try {
        await updateUniverseChatUniverseSettings(universeId, {
          globalChatStatus: enabled ? 'Enabled' : 'Disabled',
        });
        setCrossServerChatEnabled(enabled);
        setOnSave(true);
        showBottomToast(translate('Message.ConfigureExperienceSuccess'));
      } catch {
        showBottomToast(translate('Error.Unknown'));
      } finally {
        setOnSave(false);
      }
    },
    [showBottomToast, translate, universeId],
  );

  const handleTryAgain = () => {
    getCommunicationSettings();
  };

  useEffect(() => {
    // Only get if saved OR on first page load
    if (isPageReady === false) {
      getCommunicationSettings();
    }
    if (onSave) {
      getCommunicationSettings();
    }
  }, [onSave, isPageReady, getCommunicationSettings]);

  if (!communicationSetting && !isGetCommunicationSettingFailed) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='communication-settings-container-loading' />
      </EmptyGrid>
    );
  }

  if (isGetCommunicationSettingFailed) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handleTryAgain}
      />
    );
  }

  return (
    <div>
      <CommunicationSettingsForm
        universeId={universeIdNumber}
        communicationSetting={communicationSetting!}
        updateCommunicationSetting={putCommunicationSettings}
        showCrossServerChatSetting={showCrossServerChatSetting}
        crossServerChatEnabled={showCrossServerChatSetting ? crossServerChatEnabled : undefined}
        updateCrossServerChat={showCrossServerChatSetting ? saveCrossServerChat : undefined}
      />
    </div>
  );
};

export default withTranslation(CommunicationSettingsContainer, [
  TranslationNamespace.CommunicationSettings,
  TranslationNamespace.Error,
]);
