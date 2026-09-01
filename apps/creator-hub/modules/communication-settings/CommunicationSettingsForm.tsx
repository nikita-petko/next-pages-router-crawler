import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import Router from 'next/router';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  Divider,
  Grid,
  InfoOutlinedIcon,
  Link,
  Switch,
  Tooltip,
  Typography,
} from '@rbx/ui';
import experienceGuidelinesServiceApiClient from '@modules/clients/experienceGuidelinesService';
import { CONTENT_RESTRICTED } from '@modules/experience-guidelines/hooks/useCreatorEligibility';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import type AtfsCommunicationSetting from './AtfsCommunicationSetting';
import useCommunicationSettingStyles from './CommunicationSettingsForm.styles';

const { docs } = creatorHub;

type CommunicationSettingsFormProps = {
  universeId: number;
  communicationSetting: AtfsCommunicationSetting; // for now we only support one setting: Profanity
  updateCommunicationSetting(value: AtfsCommunicationSetting): Promise<void>;
  /** Feature flag: when false, cross-server chat block is hidden and not saved. */
  showCrossServerChatSetting?: boolean;
  /** Cross-server (global) chat: initial value from universe-chat API; undefined if not loaded or failed */
  crossServerChatEnabled?: boolean;
  /** Callback to persist cross-server chat; called only when that toggle changed */
  updateCrossServerChat?(enabled: boolean): Promise<void>;
};

type CommunicationSettingFormType = {
  strongLanguageOptedOut: boolean;
};

const CommunicationSettingsForm: FunctionComponent<
  React.PropsWithChildren<CommunicationSettingsFormProps>
> = ({
  universeId,
  communicationSetting,
  updateCommunicationSetting,
  showCrossServerChatSetting = false,
  crossServerChatEnabled,
  updateCrossServerChat,
}) => {
  const {
    classes: { formContainer, saveButton, buttonContainer },
  } = useCommunicationSettingStyles();
  const { classes: styles } = useCommunicationSettingStyles();

  const { translate } = useTranslation();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const initialCrossServerChat = crossServerChatEnabled ?? false;
  const [allowCrossServerChat, setAllowCrossServerChat] = useState<boolean>(initialCrossServerChat);
  const [allowStrongLanguage, setAllowStrongLanguage] = useState<boolean>(
    communicationSetting.optedOut,
  );
  const [isContentRestricted, setIsContentRestricted] = useState<boolean>(false);

  const checkIsContentRestrictedExperience = useCallback(async () => {
    let isContentRestrictedInEgs = false;
    try {
      const response = await experienceGuidelinesServiceApiClient.getDetailedGuidelines(universeId);
      isContentRestrictedInEgs =
        response.ageRecommendationDetails?.ageRecommendationSummary?.ageRecommendation
          ?.contentMaturity === CONTENT_RESTRICTED;
    } catch {
      // Do nothing, let the asset-text-filter-settings API do the age check as well
    } finally {
      setIsContentRestricted(isContentRestrictedInEgs);
    }
  }, [universeId]);

  const { handleSubmit, formState } = useForm<CommunicationSettingFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues: { strongLanguageOptedOut: communicationSetting.optedOut },
    shouldUnregister: true,
  });

  const { isSubmitting } = formState;
  const handleFormCancel = useCallback(() => {
    void Router.push(`/dashboard/creations/experiences/${universeId}/overview`);
  }, [universeId]);

  const handleFormSubmit: SubmitHandler<CommunicationSettingFormType> = useCallback(async () => {
    setIsLoading(true);
    try {
      const strongLanguageChanged = allowStrongLanguage !== communicationSetting.optedOut;
      if (strongLanguageChanged) {
        await updateCommunicationSetting({
          ...communicationSetting,
          optedOut: allowStrongLanguage,
        });
      }
      if (showCrossServerChatSetting) {
        const crossServerChanged = allowCrossServerChat !== (crossServerChatEnabled ?? false);
        if (crossServerChanged && updateCrossServerChat) {
          await updateCrossServerChat(allowCrossServerChat);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    // oxlint-disable-next-line react/react-compiler -- all deps needed for correct submit behavior
    allowStrongLanguage,
    allowCrossServerChat,
    communicationSetting,
    updateCommunicationSetting,
    updateCrossServerChat,
    crossServerChatEnabled,
    showCrossServerChatSetting,
  ]);

  useEffect(() => {
    void checkIsContentRestrictedExperience();
  }, [checkIsContentRestrictedExperience]);

  useEffect(() => {
    if (showCrossServerChatSetting && crossServerChatEnabled !== undefined) {
      // oxlint-disable-next-line react/react-compiler -- syncing local state with prop changes
      setAllowCrossServerChat(crossServerChatEnabled);
    }
  }, [crossServerChatEnabled, showCrossServerChatSetting]);

  const crossServerChatChanged =
    showCrossServerChatSetting && allowCrossServerChat !== (crossServerChatEnabled ?? false);
  const hasFormChanges =
    allowStrongLanguage !== communicationSetting.optedOut || crossServerChatChanged;

  return (
    <Grid container item className={formContainer} data-testid='communication-settings-form'>
      <Grid container item XSmall={12}>
        <Typography variant='h1'>{translate('Heading.CommunicationSettings')}</Typography>
      </Grid>

      {showCrossServerChatSetting ? (
        <>
          <Grid container item XSmall={12}>
            <Typography variant='h6'>
              {translate(
                'Heading.CrossServerChat' /* TranslationNamespace.CommunicationSettings */,
              )}
            </Typography>
          </Grid>
          <Grid container item XSmall={12}>
            <Typography variant='body1'>
              {translate(
                'Label.CrossServerChatDescription' /* TranslationNamespace.CommunicationSettings */,
              )}
            </Typography>
          </Grid>
          <Grid className={styles.channelContainer} container direction='column'>
            <Grid item className={styles.option}>
              <Switch
                aria-label='cross-server-chat-switch'
                data-testid='cross-server-chat-switch'
                checked={allowCrossServerChat}
                onChange={() => setAllowCrossServerChat((prev) => !prev)}
              />
              <Typography>
                {translate(
                  'Toggle.AllowCrossServerChat' /* TranslationNamespace.CommunicationSettings */,
                )}
              </Typography>
            </Grid>
            <Typography variant='body2' component='div'>
              <span data-testid='cross-server-chat-toggle-hint'>
                {allowCrossServerChat
                  ? translate(
                      'Label.CrossServerChatToggleHintEnabled' /* TranslationNamespace.CommunicationSettings */,
                    )
                  : translate(
                      'Label.CrossServerChatToggleHintDisabled' /* TranslationNamespace.CommunicationSettings */,
                    )}
              </span>
              <Link
                href={`${docs.getExperiencesPublishingUrl()}#creator-dashboard`}
                style={{ marginLeft: 4 }}
                target='_blank'
                underline='hover'>
                {translate('Label.LearnMore')}
              </Link>
            </Typography>
          </Grid>

          <Grid container item XSmall={12} XLarge={8}>
            <Grid item XSmall={12}>
              <Divider />
            </Grid>
          </Grid>
        </>
      ) : null}

      <Grid container item XSmall={12}>
        <Typography variant='h6'>{translate('Heading.StrongLanguage')}</Typography>
        <Tooltip
          title={translate('Tooltip.StrongLanguage')}
          placement='right'
          enterTouchDelay={0}
          leaveTouchDelay={3000}>
          <InfoOutlinedIcon style={{ paddingLeft: 4 }} />
        </Tooltip>
      </Grid>
      <Grid container item XSmall={12}>
        <Typography variant='body1'>
          {translate('Label.StrongLanguageDescriptionContentMaturity')}
        </Typography>
      </Grid>
      <Grid className={styles.channelContainer} container direction='column'>
        <Grid item className={styles.option} key={communicationSetting.category}>
          <Typography>{translate('Toggle.AllowStrongLanguage')}</Typography>
          {!isContentRestricted ? (
            <Tooltip
              title={translate('Label.NonRestrictedGameNotAllowedToEnableStrongLanguage')}
              placement='top'
              enterTouchDelay={0}
              leaveTouchDelay={3000}>
              <span>
                <Switch
                  aria-label='switch'
                  data-testid='strong-language-switch'
                  checked={allowStrongLanguage}
                  disabled={!isContentRestricted}
                  onChange={() => {
                    setAllowStrongLanguage((prev) => !prev);
                  }}
                />
              </span>
            </Tooltip>
          ) : (
            <Switch
              aria-label='switch'
              data-testid='strong-language-switch'
              checked={allowStrongLanguage}
              disabled={!isContentRestricted}
              onChange={() => {
                setAllowStrongLanguage((prev) => !prev);
              }}
            />
          )}
        </Grid>

        <Typography variant='body2'>
          <span data-testid='toggle-hint'>
            {allowStrongLanguage
              ? translate('Label.StrongLanguageToggleHintEnabled')
              : translate('Label.StrongLanguageToggleHintDisabled')}
          </span>
          <Link
            href={`${docs.getExperiencesPublishingUrl()}#creator-dashboard`}
            target='_blank'
            underline='hover'>
            {translate('Label.LearnMore')}
          </Link>
        </Typography>
      </Grid>
      <Grid container item XSmall={12} XLarge={8}>
        <Grid item XSmall={12}>
          <Divider />
        </Grid>
        <Grid container item XSmall={12} className={buttonContainer}>
          <Button
            variant='outlined'
            size='large'
            onClick={handleFormCancel}
            disabled={isSubmitting}>
            {translate('Action.Cancel')}
          </Button>
          <Button
            className={saveButton}
            data-testid='configure-experience-button'
            variant='contained'
            size='large'
            disabled={!hasFormChanges}
            onClick={handleSubmit(handleFormSubmit)}
            loading={isSubmitting || isLoading}>
            {translate('Action.Save')}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};

export type { CommunicationSettingsFormProps };

export default withTranslation(CommunicationSettingsForm, [
  TranslationNamespace.Navigation,
  TranslationNamespace.CommunicationSettings,
]);
