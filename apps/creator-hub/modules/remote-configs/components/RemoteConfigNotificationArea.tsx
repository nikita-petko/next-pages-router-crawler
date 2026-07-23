import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { Alert, AlertTitle, makeStyles, Typography } from '@rbx/ui';
import { isCreatorConfigStudioPublishTimerEnabled as isCreatorConfigStudioPublishTimerEnabledFlag } from '@generated/flags/creatorAnalytics';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { PublishingMetadata } from '@modules/clients/analytics/universeConfigs';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { DeploymentStrategy } from '../api/universeConfigsClientEnums';
import useCanConfigureOrPublish from '../hooks/useCanConfigureOrPublish';
import usePublishRemainingMs from '../utils/usePublishRemainingMs';
import type { Action } from './ActionButton';
import ActionButton from './ActionButton';
import type { ActionsInGroup } from './ActionButtonGroup';
import ActionButtonGroup from './ActionButtonGroup';

const publishRemainingMsToTimeStr = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const useStyles = makeStyles()((theme) => {
  return {
    alert: {
      margin: '12px 0',
      [theme.breakpoints.down('Medium')]: {
        flexWrap: 'wrap',
      },
    },
    alertTitle: {
      lineHeight: 'unset',
    },
    action: {
      alignItems: 'center',
      flex: '0 0 fit-content',
      gap: '12px',
      paddingTop: '0',
      [theme.breakpoints.down('Medium')]: {
        marginLeft: '0',
        paddingLeft: '0',
        margin: '4px 0 12px 0',
      },
    },
  };
});

const RemoteConfigNotificationArea = ({
  onPublishComplete: refresh,
  publishing,
  draftCount,
  hasRuleOrderingDraftChanges = false,
  isDisabledDueToMissingDraftHash,
  onDiscard,
  onCancelPublish,
  onPublish,
  onForcePublish,
  isPublishing,
}: {
  publishing?: PublishingMetadata;
  onPublishComplete: () => void;
  draftCount: number;
  hasRuleOrderingDraftChanges?: boolean;
  isDisabledDueToMissingDraftHash: boolean;
  onDiscard: () => void;
  onCancelPublish: () => void;
  onForcePublish: () => void;
  onPublish: (deploymentStrategy: DeploymentStrategy) => void;
  isPublishing?: boolean;
}) => {
  const {
    classes: { action, alertTitle, alert },
  } = useStyles();
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { canPublish } = useCanConfigureOrPublish();

  const publishNow = useCallback(() => onPublish(DeploymentStrategy.Immediate), [onPublish]);
  const publishSlowly = useCallback(
    () => onPublish(DeploymentStrategy.GradualRollout),
    [onPublish],
  );

  const {
    ready: isCreatorConfigStudioPublishTimerReady,
    value: isCreatorConfigStudioPublishTimerEnabledValue,
  } = useFlag(isCreatorConfigStudioPublishTimerEnabledFlag);
  const isCreatorConfigStudioPublishTimerEnabled =
    isCreatorConfigStudioPublishTimerReady && isCreatorConfigStudioPublishTimerEnabledValue;

  const sharedPublishRemainingMs = usePublishRemainingMs(
    isCreatorConfigStudioPublishTimerEnabled ? publishing : undefined,
    isCreatorConfigStudioPublishTimerEnabled ? refresh : undefined,
  );

  const [publishRemainingMs, setPublishRemainingMs] = useState(0);
  const stagedRuleOrderingOnlyTitle = tPendingTranslation(
    'You have staged rule ordering changes.',
    'Title shown when there are only staged rule ordering changes.',
    translationKey(
      'Description.PublishReminder.Header.RuleOrderingOnly',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const stagedRuleOrderingOnlySubtext = tPendingTranslation(
    'Test your staged rule ordering changes in Studio first before publishing to players',
    'Helper text shown when there are only staged rule ordering changes.',
    translationKey(
      'Description.PublishReminder.Subtext.RuleOrderingOnly',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const stagedConfigsAndRuleOrderingTitle = tPendingTranslation(
    'You have {configCount} staged configs and staged rule ordering changes.',
    'Title shown when both staged configs and staged rule ordering changes exist.',
    translationKey(
      'Description.PublishReminder.Header.ConfigsAndRuleOrdering',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    { configCount: `${draftCount}` },
  );
  const stagedConfigsAndRuleOrderingSubtext = tPendingTranslation(
    'Test your staged config and rule ordering changes in Studio first before publishing to players',
    'Helper text shown when both staged configs and staged rule ordering changes exist.',
    translationKey(
      'Description.PublishReminder.Subtext.ConfigsAndRuleOrdering',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  useEffect(() => {
    if (isCreatorConfigStudioPublishTimerEnabled) {
      return () => {};
    }
    const estimatedCompletionTime = publishing?.estimatedCompletionTime;
    if (!estimatedCompletionTime) {
      return () => {};
    }

    let interval: NodeJS.Timeout | null = null;
    const updatePublishRemainingMs = () => {
      const msRemaining = new Date(estimatedCompletionTime).getTime() - Date.now();
      setPublishRemainingMs(msRemaining);
      if (msRemaining <= 0 && interval) {
        clearInterval(interval);
        refresh();
      }
    };
    interval = setInterval(updatePublishRemainingMs, 1000);
    updatePublishRemainingMs();
    return () => clearInterval(interval);
  }, [publishing, refresh, isCreatorConfigStudioPublishTimerEnabled]);

  const effectivePublishRemainingMs = isCreatorConfigStudioPublishTimerEnabled
    ? sharedPublishRemainingMs
    : publishRemainingMs;

  const notificationAreaSpec: null | {
    severity: 'info' | 'warning' | 'error';
    title: string;
    description: string;
    actions: Array<
      | Action
      | {
          groupId: string;
          actions: ActionsInGroup;
          variant: 'contained' | 'outlined';
        }
    >;
  } = useMemo(() => {
    if (publishing) {
      const timeRemainingStr =
        effectivePublishRemainingMs > 0
          ? publishRemainingMsToTimeStr(effectivePublishRemainingMs)
          : translate(
              translationKey(
                'Label.TimeRemaining.Unknown',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            );

      return {
        severity: 'info',
        title: translate(
          translationKey(
            'Description.PublishingMessage.Header',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          { publishCount: `${publishing.publishingCountTotal}` },
        ),
        description: translate(
          translationKey(
            'Description.PublishingMessage.Subtext',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          { timeRemainingStr },
        ),
        actions: [
          {
            buttonLabel: translate(
              translationKey(
                'Action.Button.ForcePublish',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            ),
            onAction: onForcePublish,
            isDisabled: isDisabledDueToMissingDraftHash || !canPublish,
            variant: 'outlined',
            dataTestId: 'force-publish-button',
          },
          {
            buttonLabel: translate(
              translationKey(
                'Action.Button.CancelPublish',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            ),
            onAction: onCancelPublish,
            isDisabled: isDisabledDueToMissingDraftHash || !canPublish,
            variant: 'outlined',
            dataTestId: 'cancel-publish-button',
          },
        ],
      };
    }

    if (draftCount > 0 || hasRuleOrderingDraftChanges) {
      let title: string;
      let description: string;
      if (draftCount > 0 && hasRuleOrderingDraftChanges) {
        title = stagedConfigsAndRuleOrderingTitle;
        description = stagedConfigsAndRuleOrderingSubtext;
      } else if (hasRuleOrderingDraftChanges) {
        title = stagedRuleOrderingOnlyTitle;
        description = stagedRuleOrderingOnlySubtext;
      } else {
        title = translate(
          translationKey(
            'Description.PublishReminder.Header',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          { changeCount: `${draftCount}` },
        );
        description = translate(
          translationKey(
            'Description.PublishReminder.Subtext',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      }

      const publishNowButtonLabel = hasRuleOrderingDraftChanges
        ? translate(
            translationKey(
              'Action.Button.PublishNow',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )
        : translate(
            translationKey(
              'Action.Button.PublishNowWithChangeCount',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
            { changeCount: `${draftCount}` },
          );
      const publishSlowlyButtonLabel = hasRuleOrderingDraftChanges
        ? translate(
            translationKey(
              'Action.Button.PublishSlowly',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )
        : translate(
            translationKey(
              'Action.Button.PublishSlowlyWithChangeCount',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
            { changeCount: `${draftCount}` },
          );

      return {
        severity: 'info',
        title,
        description,
        actions: [
          {
            groupId: 'publish-group',
            variant: 'contained',
            actions: [
              {
                buttonLabel: publishNowButtonLabel,
                optionLabel: translate(
                  translationKey(
                    'Action.Button.PublishNow',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                ),
                onAction: publishNow,
                isDisabled: isDisabledDueToMissingDraftHash || isPublishing === true || !canPublish,
                dataTestId: 'publish-button',
              },
              {
                buttonLabel: publishSlowlyButtonLabel,
                optionLabel: translate(
                  translationKey(
                    'Action.Button.PublishSlowly',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                ),
                onAction: publishSlowly,
                isDisabled: isDisabledDueToMissingDraftHash || isPublishing === true || !canPublish,
                dataTestId: 'publish-button',
              },
            ],
          },
          {
            buttonLabel: translate(
              translationKey(
                'Action.Button.Discard',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            ),
            onAction: onDiscard,
            variant: 'outlined',
            isDisabled: isDisabledDueToMissingDraftHash || !canPublish,
            dataTestId: 'discard-button',
          },
        ],
      };
    }

    return null;
  }, [
    draftCount,
    hasRuleOrderingDraftChanges,
    publishing,
    stagedConfigsAndRuleOrderingSubtext,
    stagedConfigsAndRuleOrderingTitle,
    stagedRuleOrderingOnlySubtext,
    stagedRuleOrderingOnlyTitle,
    effectivePublishRemainingMs,
    translate,
    onForcePublish,
    isDisabledDueToMissingDraftHash,
    canPublish,
    onCancelPublish,
    publishNow,
    isPublishing,
    publishSlowly,
    onDiscard,
  ]);

  const actionButtons = useMemo(() => {
    return notificationAreaSpec?.actions.map((individualAction) => {
      if ('groupId' in individualAction) {
        return (
          <ActionButtonGroup
            key={individualAction.groupId}
            actions={individualAction.actions}
            variant={individualAction.variant}
          />
        );
      }
      return <ActionButton key={individualAction.dataTestId} action={individualAction} />;
    });
  }, [notificationAreaSpec]);

  if (!notificationAreaSpec) {
    return [];
  }
  const { severity, title, description } = notificationAreaSpec;
  return (
    <Alert
      variant='outlined'
      severity={severity}
      classes={{ root: alert, action }}
      action={actionButtons}>
      <AlertTitle
        classes={{
          root: alertTitle,
        }}>
        {title}
      </AlertTitle>
      <Typography component='div' marginTop='6px' variant='smallLabel1'>
        {description}
      </Typography>
    </Alert>
  );
};
export default RemoteConfigNotificationArea;
