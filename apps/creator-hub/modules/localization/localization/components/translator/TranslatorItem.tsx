import React, { FunctionComponent, useCallback, useMemo } from 'react';
import {
  ListItem,
  Avatar,
  CircularProgress,
  ListItemAvatar,
  Typography,
  ListItemSecondaryAction,
  ListItemText,
} from '@rbx/ui';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { useTranslation } from '@rbx/intl';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { TranslatorType } from '@modules/clients/translationRoles';
import useLocalizationTranslatorsContainerStyles from '../../container/LocalizationTranslatorsContainer.styles';
import TranslatorItemMenu from './TranslatorItemMenu';
import TranslatorItemDisplayName from './TranslatorItemDisplayName';
import { TranslatorAssigneeData } from '../../types/TranslatorInfo';
import { LOCALIZATION_LOADER_SIZE } from '../../constants/LocalizationConstants';
import useTranslatorManagement from '../../hooks/useTranslatorManagement';

export interface TranslatorItemProps {
  translatorData: TranslatorAssigneeData;
}

export const TOAST_AUTO_HIDE_DURATION_MILLISECONDS = 5000;
export const TRANSLATOR_ITEM_SKELETON_HEIGHT = 72;

const TranslatorItem: FunctionComponent<React.PropsWithChildren<TranslatorItemProps>> = ({
  translatorData,
}) => {
  const { translate } = useTranslation();
  const { error } = useMetricsMonitoring();
  const {
    classes: { translatorListItem, translatorDeletingItem },

    cx,
  } = useLocalizationTranslatorsContainerStyles();
  const { translatorIdInDeletion, deleteTranslator } = useTranslatorManagement();

  const handelTranslatorDeletion = useCallback(async () => {
    try {
      await deleteTranslator(translatorData);
    } catch (e) {
      error('Localization - Translator - Failed to delete translator');
    }
  }, [deleteTranslator, translatorData, error]);

  const formatedSecondaryInfo = useMemo(() => {
    switch (translatorData.type) {
      case TranslatorType.User:
        return `@${translatorData.name}`;
      case TranslatorType.Group:
        return translate('Label.EntireGroup');
      default:
        return translatorData.name;
    }
  }, [translatorData, translate]);

  if (translatorIdInDeletion === translatorData.id) {
    return (
      <div className={cx(translatorListItem, translatorDeletingItem)}>
        <CircularProgress size={LOCALIZATION_LOADER_SIZE} />
      </div>
    );
  }

  return (
    <ListItem className={translatorListItem}>
      <ListItemAvatar>
        <Avatar variant='circular' alt='avatar'>
          <Thumbnail2d
            targetId={
              translatorData.type === TranslatorType.GroupRole
                ? translatorData.groupId!
                : translatorData.id
            }
            type={
              translatorData.type === TranslatorType.User
                ? ThumbnailTypes.avatarHeadshot
                : ThumbnailTypes.groupIcon
            }
            alt={translatorData.name ?? 'avatar'}
          />
        </Avatar>
      </ListItemAvatar>
      <ListItemText>
        <TranslatorItemDisplayName translatorData={translatorData} />
      </ListItemText>
      <ListItemText>
        <Typography variant='body2' color='secondary'>
          {formatedSecondaryInfo}
        </Typography>
      </ListItemText>
      <ListItemSecondaryAction>
        <TranslatorItemMenu onDelete={handelTranslatorDeletion} />
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default TranslatorItem;
