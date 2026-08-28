import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ProgressCircle, Snackbar, Toggle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ModerationTabs, { ModerationTab } from '../ModerationTabs';
import { isEnhancedAntiCheatEnabled } from './antiCheatConfig.mapping';
import { AntiCheatEvents } from './antiCheatConstants';
import AntiCheatPlaceSelect from './AntiCheatPlaceSelect';
import { useAntiCheatConfigQuery, useSetEnhancedAntiCheatMutation } from './useAntiCheatConfig';

const SettingLabelId = 'enhanced-anti-cheat-label';
const SettingDescriptionId = 'enhanced-anti-cheat-description';

type AntiCheatSettingsProps = {
  universeId: number;
  placeId: number;
};

const AntiCheatSettings: FC<AntiCheatSettingsProps> = ({ universeId, placeId }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const [snackbarTitle, setSnackbarTitle] = useState<string | null>(null);
  const loggedImpressionPlaceId = useRef<number | null>(null);
  const configQuery = useAntiCheatConfigQuery(placeId.toString());
  const { refetch: refetchConfig } = configQuery;
  const setConfigMutation = useSetEnhancedAntiCheatMutation(placeId.toString());
  const isEnabled = configQuery.data ? isEnhancedAntiCheatEnabled(configQuery.data) : false;

  const heading = tPendingTranslation(
    'Enhanced anti-cheat',
    'Page heading for the Enhanced anti-cheat feature in Creator Hub, where creators configure additional anti-cheat protections for their experience. “Enhanced anti-cheat” is the feature name.',
    translationKey('Heading.EnhancedAntiCheat', TranslationNamespace.AntiCheat),
  );
  const description = tPendingTranslation(
    'Toggling this enables additional security measures on Android devices.',
    'Supporting text for the Android setting. It explains that enabling the setting applies additional security measures to players joining the creator’s experience from Android devices.',
    translationKey('Description.EnhancedAntiCheatAndroid', TranslationNamespace.AntiCheat),
  );
  const successMessage = tPendingTranslation(
    'Enhanced anti-cheat updated',
    'Success notification shown after a creator successfully updates the Enhanced anti-cheat setting.',
    translationKey('Message.EnhancedAntiCheatUpdated', TranslationNamespace.AntiCheat),
  );
  const errorMessage = tPendingTranslation(
    'Enhanced anti-cheat could not be updated. Try again.',
    'Error notification shown when a creator’s attempt to update the Enhanced anti-cheat setting fails. “Try again” instructs the creator to repeat the action.',
    translationKey('Message.EnhancedAntiCheatUpdateFailed', TranslationNamespace.AntiCheat),
  );
  const closeLabel = tPendingTranslation(
    'Close',
    'Button that dismisses the success or error notification shown after an attempt to update the Enhanced anti-cheat setting.',
    translationKey('Action.CloseEnhancedAntiCheatFeedback', TranslationNamespace.AntiCheat),
  );
  const loadingLabel = tPendingTranslation(
    'Loading enhanced anti-cheat settings',
    'Accessible loading label announced or displayed while Creator Hub retrieves the Enhanced anti-cheat settings for the creator’s experience.',
    translationKey('Label.LoadingEnhancedAntiCheat', TranslationNamespace.AntiCheat),
  );

  // Log one impression per place once its config has loaded, so switching places re-logs.
  useEffect(() => {
    if (!configQuery.isSuccess || loggedImpressionPlaceId.current === placeId) {
      return;
    }
    loggedImpressionPlaceId.current = placeId;
    unifiedLogger.logImpressionEvent({
      eventName: AntiCheatEvents.SETTING_IMPRESSION_EVENT,
      parameters: {
        universeId: universeId.toString(),
        placeId: placeId.toString(),
        isEnabled: isEnabled.toString(),
      },
    });
  }, [configQuery.isSuccess, isEnabled, placeId, unifiedLogger, universeId]);

  const handleToggleChange = useCallback(
    (nextIsEnabled: boolean) => {
      setSnackbarTitle(null);
      setConfigMutation.mutate(nextIsEnabled, {
        onSuccess: () => {
          setSnackbarTitle(successMessage);
          unifiedLogger.logClickEvent({
            eventName: AntiCheatEvents.TOGGLE_CLICK_EVENT,
            parameters: {
              universeId: universeId.toString(),
              placeId: placeId.toString(),
              requestedState: nextIsEnabled.toString(),
            },
          });
        },
        onError: () => {
          setSnackbarTitle(errorMessage);
          unifiedLogger.logErrorEvent({
            eventName: AntiCheatEvents.TOGGLE_CLICK_EVENT_ERROR,
            parameters: {
              universeId: universeId.toString(),
              placeId: placeId.toString(),
              requestedState: nextIsEnabled.toString(),
            },
          });
        },
      });
    },
    [errorMessage, placeId, setConfigMutation, successMessage, unifiedLogger, universeId],
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbarTitle(null);
  }, []);

  const handleReloadConfig = useCallback(() => {
    void refetchConfig();
  }, [refetchConfig]);

  const getSettingSection = (): ReactNode => {
    if (configQuery.isLoading) {
      return (
        <div className='height-1600 width-full items-center justify-center flex'>
          <ProgressCircle ariaLabel={loadingLabel} />
        </div>
      );
    }

    if (configQuery.isError) {
      return <LoadError onReload={handleReloadConfig} />;
    }

    return (
      <section className='bg-surface-100 stroke-standard stroke-default radius-medium padding-large width-full items-center justify-between gap-large flex'>
        <div className='min-width-0 gap-xsmall flex flex-col'>
          <h2 id={SettingLabelId} className='content-emphasis text-heading-small'>
            {heading}
          </h2>
          <p id={SettingDescriptionId} className='content-default text-body-medium'>
            {description}
          </p>
        </div>
        <Toggle
          className='shrink-0'
          size='Medium'
          placement='Start'
          isChecked={isEnabled}
          isDisabled={setConfigMutation.isPending}
          aria-labelledby={SettingLabelId}
          aria-describedby={SettingDescriptionId}
          onCheckedChange={handleToggleChange}
        />
      </section>
    );
  };

  return (
    <ModerationTabs activeTab={ModerationTab.AntiCheat}>
      <div className='width-full gap-large flex flex-col'>
        <AntiCheatPlaceSelect universeId={universeId} selectedPlaceId={placeId} />
        {getSettingSection()}
      </div>
      {snackbarTitle !== null ? (
        <Snackbar
          title={snackbarTitle}
          closeIconAriaLabel={closeLabel}
          shouldAutoDismiss
          onClose={handleCloseSnackbar}
        />
      ) : null}
    </ModerationTabs>
  );
};

// Load the AntiCheat namespace this component and AntiCheatPlaceSelect read, so their strings
// resolve at runtime instead of falling back to English. ModerationTabs loads its own namespaces.
export default withTranslation(AntiCheatSettings, [TranslationNamespace.AntiCheat]);
