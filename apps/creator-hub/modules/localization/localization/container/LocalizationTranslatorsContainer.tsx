import type { FunctionComponent } from 'react';
import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Chip, Grid, List, Typography, CircularProgress, Button } from '@rbx/ui';
import { TranslatorType } from '@modules/clients/translationRoles';
import type { TrackerClientRequest } from '@modules/eventStream/constants/eventConstants';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import CreatorDashboardSource from '@modules/eventStream/enum/CreatorDashboardSource';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { PageLoading } from '@modules/miscellaneous/components';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import useTranslationToast from '../../common/hooks/useTranslationToast';
import TranslatorAdder from '../components/translator/TranslatorAdder';
import TranslatorItem from '../components/translator/TranslatorItem';
import { LOCALIZATION_LOADER_SIZE } from '../constants/LocalizationConstants';
import useTranslatorManagement from '../hooks/useTranslatorManagement';
import useLocalizationTranslatorsContainerStyles from './LocalizationTranslatorsContainer.styles';

const LocalizationTranslatorsContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { trackerClient } = useEventTrackerProvider();
  const {
    classes: {
      container,
      rowMenu,
      userChip,
      translatorList,
      translatorListItem,
      translatorDeletingItem,
    },

    cx,
  } = useLocalizationTranslatorsContainerStyles();
  const { translate } = useTranslation();
  const [selectedTranslatorType, setSelectedTranslatorType] = useState<TranslatorType>(
    TranslatorType.User,
  );
  const {
    isTranslatorListLoading,
    isTranslatorListFetchFailed,
    translatorData,
    isAddingTranslator,
  } = useTranslatorManagement();
  const { gameDetails } = useCurrentGame();
  const { showSuccessToast, showFailureToast } = useTranslationToast();

  const displayTranslatorList = useMemo(() => {
    return translatorData?.filter((translator) => {
      if (selectedTranslatorType === TranslatorType.User) {
        return translator.type === TranslatorType.User;
      }
      return translator.type !== TranslatorType.User;
    });
  }, [translatorData, selectedTranslatorType]);

  const shareLink = useCallback(() => {
    if (gameDetails && gameDetails.id) {
      const url = new URL(
        `/dashboard/creations/experiences/${gameDetails.id}/localization/translation?activeTab=strings`,
        process.env.baseUrl,
      ).href;
      navigator.clipboard.writeText(url);
      const shareLinkTrackerClientRequest: TrackerClientRequest = {
        eventType: CreatorDashboardEventType.ShareLinkTranslators,
        context: CreatorDashboardContext.Click,
        additionalProperties: {
          Source: CreatorDashboardSource.LocalizationTranslatorTab,
        },
      };
      trackerClient.sendEvent(shareLinkTrackerClientRequest);
      showSuccessToast(translate('Message.LinkCopied'));
    } else {
      showFailureToast(translate('Message.LinkCopyFailed'));
    }
  }, [gameDetails, showSuccessToast, showFailureToast, translate, trackerClient]);

  if (isTranslatorListLoading) {
    return <PageLoading />;
  }

  if (isTranslatorListFetchFailed) {
    return (
      <Typography color='secondary' align='center'>
        {translate('Message.LoadTranslatorFailure')}
      </Typography>
    );
  }

  return (
    <Grid container direction='column' className={container}>
      <Grid container alignItems='center' direction='row' className={rowMenu} wrap='nowrap'>
        {process.env.buildTarget !== 'luobu' && (
          <Grid item container justifyContent='flex-start'>
            <Chip
              variant={selectedTranslatorType === TranslatorType.User ? 'filled' : 'outlined'}
              color='primary'
              label={translate('Label.Users')}
              className={userChip}
              onClick={() => setSelectedTranslatorType(TranslatorType.User)}
            />
            <Chip
              variant={selectedTranslatorType === TranslatorType.Group ? 'filled' : 'outlined'}
              color='primary'
              label={translate('Label.Groups')}
              onClick={() => setSelectedTranslatorType(TranslatorType.Group)}
            />
          </Grid>
        )}
        <Grid item container justifyContent='flex-end' alignItems='center' spacing={1}>
          <Grid item>
            <Button variant='contained' size='small' onClick={shareLink}>
              {translate('Label.ShareLink')}
            </Button>
          </Grid>
          <Grid item>
            <TranslatorAdder currentTranslators={translatorData} />
          </Grid>
        </Grid>
      </Grid>
      <List className={translatorList}>
        {isAddingTranslator && (
          <div className={cx(translatorListItem, translatorDeletingItem)}>
            <CircularProgress size={LOCALIZATION_LOADER_SIZE} />
          </div>
        )}
        {displayTranslatorList &&
          displayTranslatorList.length > 0 &&
          displayTranslatorList.map((translator) => (
            <TranslatorItem key={translator.id} translatorData={translator} />
          ))}
      </List>
      {!isAddingTranslator && displayTranslatorList && displayTranslatorList.length === 0 && (
        <Typography color='secondary' align='center'>
          {translate('Message.NoTranslator')}
        </Typography>
      )}
    </Grid>
  );
};

export default LocalizationTranslatorsContainer;
