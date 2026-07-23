import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Switch, Divider, Select, MenuItem, Button, Link } from '@rbx/ui';
import localizationTableClient from '@modules/clients/localizationTables';
import { getErrorStatus } from '@modules/clients/utils/errorHelpers';
import {
  clearAutoCapturedTableEventModel,
  localizationSettingsToggledEventModel,
} from '@modules/eventStream/constants/eventConstants';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import CreatorDashboardUserResponse from '@modules/eventStream/enum/CreatorDashboardUserResponse';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import Panel from '../../common/components/Panel';
import useTranslationToast from '../../common/hooks/useTranslationToast';
import {
  defaultSelectedTime,
  clearUntranslatedStringTimes,
  clearUntranslatedStringTimesTranslation,
} from '../constants/LocalizationConstants';
import LocalizationSettingsContainerStyles from './LocalizationSettingsContainer.styles';

export interface LocalizationSettingsProps {
  universeId: number;
}

const LocalizationSettingsContainer: FunctionComponent<
  React.PropsWithChildren<LocalizationSettingsProps>
> = ({ universeId }) => {
  const { trackerClient } = useEventTrackerProvider();
  const { settings } = useSettings();
  const { translate, translateHTML } = useTranslation();
  const { showSuccessToast, showFailureToast } = useTranslationToast();
  const { error } = useMetricsMonitoring();
  const {
    classes: {
      atcContainer,
      descriptionText,
      divider,
      selectPadding,
      selectWidth,
      panelStyle,
      automaticEntriesSettingToggle,
      toggleButton,
      container,
    },
  } = LocalizationSettingsContainerStyles();

  const [isAutolocalizationEnabled, setIsAutolocalizationEnabled] = useState<boolean>(false);
  const [isAutomaticDeletionsEnabled, setIsAutomaticDeletionsEnabled] = useState<boolean>(false);
  const [shouldUseLocalizationTable, setShouldUseLocalizationTable] = useState<boolean>(false);
  const [isAutomaticEntriesSettingEnabled, setIsAutomaticEntriesSettingEnabled] =
    useState<boolean>(false);
  const [selectedTime, setSelectedTime] = useState<string>(defaultSelectedTime);
  const [autoEntriesToggleLoading, setAutoEntriesToggleLoading] = useState<boolean>(false);
  const [autoEntriesDeletionsToggleLoading, setAutoEntriesDeletionsToggleLoading] =
    useState<boolean>(false);
  const [TextCaptureToggleLoading, setTextCaptureToggleLoading] = useState<boolean>(false);
  const [TranslatedContentToggleLoading, setTranslatedContentToggleLoading] =
    useState<boolean>(false);
  const [ButtonLoading, setButtonLoading] = useState<boolean>(false);

  const getAutoTranslationStatus = useCallback(async (id: number) => {
    try {
      setTextCaptureToggleLoading(true);
      setTranslatedContentToggleLoading(true);
      setAutoEntriesToggleLoading(true);
      setAutoEntriesDeletionsToggleLoading(true);
      const res = await localizationTableClient.getAutoLocalizationTable({ gameId: id });
      setIsAutolocalizationEnabled(res.isAutolocalizationEnabled ?? false);
      setShouldUseLocalizationTable(res.shouldUseLocalizationTable ?? false);
      setIsAutomaticEntriesSettingEnabled(res.isAutomaticEntriesSettingEnabled ?? false);
      setIsAutomaticDeletionsEnabled(res.isAutomaticEntriesDeletionEnabled ?? false);
    } catch {
      // do nothing - sometimes the API returns 500 when a table already exists
      // but it tries to create a new one anyway
    } finally {
      setTextCaptureToggleLoading(false);
      setTranslatedContentToggleLoading(false);
      setAutoEntriesToggleLoading(false);
      setAutoEntriesDeletionsToggleLoading(false);
    }
  }, []);

  useEffect(() => {
    getAutoTranslationStatus(universeId);
  }, [universeId, getAutoTranslationStatus]);

  const onTextCaptureToggleChange = useCallback(
    async (checked: boolean) => {
      try {
        setTextCaptureToggleLoading(true);
        setAutoEntriesToggleLoading(true);

        await localizationTableClient.patchAutolocalizationSettings({
          gameId: universeId,
          request: {
            isAutolocalizationEnabled: checked,
            isAutomaticEntriesSettingEnabled: checked,
          },
        });
        trackerClient.sendEvent(
          localizationSettingsToggledEventModel(
            CreatorDashboardEventType.AutomaticTextCaptureToggled,
            universeId,
            checked ? CreatorDashboardUserResponse.TurnOn : CreatorDashboardUserResponse.TurnOff,
            200,
          ),
        );
        setIsAutolocalizationEnabled(checked);
        setIsAutomaticEntriesSettingEnabled(checked);
        showSuccessToast(translate('Toast.ToggleSuccess'));
      } catch (ex) {
        const errorStatus = getErrorStatus(ex, 500);
        trackerClient.sendEvent(
          localizationSettingsToggledEventModel(
            CreatorDashboardEventType.AutomaticTextCaptureToggled,
            universeId,
            checked ? CreatorDashboardUserResponse.TurnOn : CreatorDashboardUserResponse.TurnOff,
            errorStatus,
          ),
        );
        error('Localization - Settings - patchAutolocalizationSettings failed');
        showFailureToast(translate('Toast.GenericError'));
      } finally {
        setTextCaptureToggleLoading(false);
        setAutoEntriesToggleLoading(false);
      }
    },
    [universeId, showSuccessToast, showFailureToast, translate, error, trackerClient],
  );

  const onTranslatedContentToggleChange = useCallback(
    async (checked: boolean) => {
      try {
        setTranslatedContentToggleLoading(true);
        await localizationTableClient.patchAutolocalizationSettings({
          gameId: universeId,
          request: {
            shouldUseLocalizationTable: checked,
          },
        });
        trackerClient.sendEvent(
          localizationSettingsToggledEventModel(
            CreatorDashboardEventType.UseTranslatedContentToggled,
            universeId,
            checked ? CreatorDashboardUserResponse.TurnOn : CreatorDashboardUserResponse.TurnOff,
            200,
          ),
        );
        setShouldUseLocalizationTable(checked);
        showSuccessToast(translate('Toast.ToggleSuccess'));
      } catch (exception) {
        const errorStatus = getErrorStatus(exception, 500);
        trackerClient.sendEvent(
          localizationSettingsToggledEventModel(
            CreatorDashboardEventType.UseTranslatedContentToggled,
            universeId,
            checked ? CreatorDashboardUserResponse.TurnOn : CreatorDashboardUserResponse.TurnOff,
            errorStatus,
          ),
        );
        error('Localization - Settings - patchAutolocalizationSettings failed');
        showFailureToast(translate('Toast.GenericError'));
      } finally {
        setTranslatedContentToggleLoading(false);
      }
    },
    [universeId, showSuccessToast, showFailureToast, translate, error, trackerClient],
  );

  const onAutomaticEntriesSettingsChange = useCallback(
    async (checked: boolean) => {
      try {
        setAutoEntriesToggleLoading(true);
        setAutoEntriesDeletionsToggleLoading(true);
        await localizationTableClient.patchAutolocalizationSettings({
          gameId: universeId,
          request: {
            isAutomaticEntriesSettingEnabled: checked,
            isAutomaticEntriesDeletionsEnabled: settings.isOldAutomaticTextCaptureDisabled
              ? checked
              : undefined,
          },
        });
        setIsAutomaticEntriesSettingEnabled(checked);
        if (settings.isOldAutomaticTextCaptureDisabled) {
          setIsAutomaticDeletionsEnabled(checked);
        }
        showSuccessToast(translate('Toast.ToggleSuccess'));
      } catch {
        error('Localization - Settings - patch automatic entries settings failed');
        showFailureToast(translate('Toast.GenericError'));
      } finally {
        setAutoEntriesToggleLoading(false);
        setAutoEntriesDeletionsToggleLoading(false);
      }
    },
    [
      universeId,
      settings.isOldAutomaticTextCaptureDisabled,
      showSuccessToast,
      translate,
      error,
      showFailureToast,
    ],
  );

  const onAutomaticEntriesDeletionsChange = useCallback(
    async (checked: boolean) => {
      try {
        setAutoEntriesDeletionsToggleLoading(true);
        await localizationTableClient.patchAutolocalizationSettings({
          gameId: universeId,
          request: {
            isAutomaticEntriesDeletionsEnabled: checked,
          },
        });
        setIsAutomaticDeletionsEnabled(checked);
        showSuccessToast(translate('Toast.ToggleSuccess'));
      } catch {
        error('Localization - Settings - patch automatic entries deletions setting failed');
        showFailureToast(translate('Toast.GenericError'));
      } finally {
        setAutoEntriesDeletionsToggleLoading(false);
      }
    },
    [universeId, showSuccessToast, showFailureToast, translate, error],
  );

  const handleChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    const selectedAgeForFlush = event.target.value as string;
    setSelectedTime(selectedAgeForFlush);
  }, []);

  const handleButtonClick = useCallback(async () => {
    try {
      setButtonLoading(true);
      await localizationTableClient.getAutoScrapeCleanup({
        gameId: universeId,
        request: { maxAgeForFlush: clearUntranslatedStringTimes[selectedTime] ?? undefined },
      });
      trackerClient.sendEvent(
        clearAutoCapturedTableEventModel(
          clearUntranslatedStringTimes[selectedTime],
          universeId,
          200,
        ),
      );
      showSuccessToast(translate('Toast.ButtonSuccess'));
    } catch (e) {
      const errorStatus = getErrorStatus(e, 500);
      trackerClient.sendEvent(
        clearAutoCapturedTableEventModel(
          clearUntranslatedStringTimes[selectedTime],
          universeId,
          errorStatus,
        ),
      );
      error('Localization - Settings - getAutoScrapeCleanup failed');
      showFailureToast(translate('Toast.GenericError'));
    } finally {
      setButtonLoading(false);
    }
  }, [
    selectedTime,
    universeId,
    showSuccessToast,
    showFailureToast,
    translate,
    error,
    trackerClient,
  ]);

  const atcDescription = translateHTML('Description.TextCaptureAddition', [
    {
      opening: 'startLink',
      closing: 'endLink',
      content(chunks) {
        return (
          <Link
            href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/localization/manual-translations#automatic-text-capture`}
            target='_blank'
            underline='always'>
            {chunks}
          </Link>
        );
      },
    },
  ]);

  return (
    <Grid>
      <Grid item container direction='row'>
        <Grid item container direction='column' XSmall={3}>
          <Typography variant='subtitle2'>{translate('Title.AutomaticTextCapture')}</Typography>
        </Grid>
        <Grid item container direction='column' XSmall={8} className={atcContainer}>
          <Grid className={descriptionText}>
            <Typography variant='captionBody'>
              {settings.isOldAutomaticTextCaptureDisabled
                ? atcDescription
                : translate('Description.AutomaticTextCapture')}
            </Typography>
          </Grid>
          <Grid>
            <Typography variant='captionBody'>
              {settings.isOldAutomaticTextCaptureDisabled
                ? translate('Description.TextCaptureDeletions')
                : translate('Description.AutomaticEntriesSettings')}
            </Typography>
          </Grid>
        </Grid>
        <Grid
          item
          container
          direction='column'
          XSmall={1}
          display='flex'
          justifyContent='flex-start'
          alignItems='end'>
          <Grid item>
            {settings.isOldAutomaticTextCaptureDisabled ? (
              <Switch
                className={automaticEntriesSettingToggle}
                aria-label='allow automatic entries management'
                size='medium'
                checked={isAutomaticEntriesSettingEnabled}
                onChange={() => onAutomaticEntriesSettingsChange(!isAutomaticEntriesSettingEnabled)}
                loading={autoEntriesToggleLoading}
              />
            ) : (
              <Switch
                className={automaticEntriesSettingToggle}
                aria-label='ATC1.0 setting'
                size='medium'
                checked={isAutolocalizationEnabled}
                onChange={() => onTextCaptureToggleChange(!isAutolocalizationEnabled)}
                loading={TextCaptureToggleLoading}
              />
            )}
          </Grid>
          <Grid item>
            {settings.isOldAutomaticTextCaptureDisabled ? (
              <Switch
                disabled={!isAutomaticEntriesSettingEnabled}
                className={automaticEntriesSettingToggle}
                aria-label='allow automatic entries deletions'
                size='medium'
                checked={isAutomaticDeletionsEnabled}
                onChange={() => onAutomaticEntriesDeletionsChange(!isAutomaticDeletionsEnabled)}
                loading={autoEntriesDeletionsToggleLoading}
              />
            ) : (
              <Switch
                disabled={!isAutolocalizationEnabled}
                className={automaticEntriesSettingToggle}
                aria-label='allow automatic entries management'
                size='medium'
                checked={isAutomaticEntriesSettingEnabled}
                onChange={() => onAutomaticEntriesSettingsChange(!isAutomaticEntriesSettingEnabled)}
                loading={autoEntriesToggleLoading}
              />
            )}
          </Grid>
        </Grid>
      </Grid>
      <Divider className={divider} />
      <Grid item container direction='row'>
        <Grid item container direction='column' XSmall={3}>
          <Typography variant='subtitle2'>{translate('Title.UseTranslatedContent')}</Typography>
        </Grid>
        <Grid item container direction='column' XSmall={8}>
          <Grid className={descriptionText}>
            <Typography variant='captionBody'>
              {translate('Description.UseTranslatedContent')}
            </Typography>
          </Grid>
        </Grid>
        <Grid
          item
          container
          direction='column'
          XSmall={1}
          display='flex'
          justifyContent='space-between'
          alignItems='end'>
          <Grid item>
            <Switch
              className={toggleButton}
              aria-label='should use localization table'
              size='medium'
              checked={shouldUseLocalizationTable}
              onChange={() => onTranslatedContentToggleChange(!shouldUseLocalizationTable)}
              loading={TranslatedContentToggleLoading}
            />
          </Grid>
        </Grid>
      </Grid>
      <Divider className={divider} />
      <Panel title={translate('Title.ClearUntranslatedAutoCapture')} className={panelStyle}>
        <Grid container wrap='nowrap' className={container}>
          <Grid item container alignItems='center' className={selectPadding}>
            <Select
              size='small'
              className={selectWidth}
              value={selectedTime}
              onChange={handleChange}
              helperText={translate('Description.ClearUntranslatedAutoCapture')}>
              {Object.keys(clearUntranslatedStringTimes).map((selectTime) => {
                return (
                  <MenuItem key={selectTime} value={selectTime}>
                    {translate(clearUntranslatedStringTimesTranslation[selectTime])}
                  </MenuItem>
                );
              })}
            </Select>
          </Grid>
          <Grid item>
            <Button variant='contained' loading={ButtonLoading} onClick={handleButtonClick}>
              {translate('Button.Clear')}
            </Button>
          </Grid>
        </Grid>
      </Panel>
    </Grid>
  );
};

export default LocalizationSettingsContainer;
