import type { FC, ReactElement } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Tooltip, useDialog } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type TimeSeriesChartExportButton from '@modules/charts-generic/charts/TimeSeriesChartExportButton';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useCreateHomepageThumbnailPersonalizationMutation,
  useFindHomepageThumbnailPersonalization,
  useUpdateHomepageThumbnailPersonalizationMutation,
} from '@modules/react-query/thumbnailPersonalization';
import { useNewlyUploadedThumbnailIdsContext } from '../context/NewlyUploadedThumbnailIdsProvider';
import PromptToActivateThumbnailsDialog from './PromptToActivateThumbnailsDialog';
import ThumbnailsAboutToDeactiveDialog from './ThumbnailsAboutToDeactiveDialog';
import WillStartNewTestDialog from './WillStartNewTestDialog';

enum SaveEvent {
  WillResetData = 'WillResetData',
  WillKeepPartialData = 'WillKeepPartialData',
  ThumbnailsAboutToDeactive = 'ThumbnailsAboutToDeactive',
  PromptToActivateThumbnails = 'PromptToActivateThumbnails',
  None = 'None',
}

type SaveChangeButtonProps = {
  universeId: number;
  initialActiveThumbnailIds: string[];
  selectedThumbnailIds: string[];
  updateSelectedThumbnailIds: (thumbnailIds: string[]) => void;
  onSaveConfirmed: () => void;
  loading: boolean;
  exportButton: ReactElement<typeof TimeSeriesChartExportButton> | null;
};

const SaveChangeButton: FC<SaveChangeButtonProps> = ({
  universeId,
  initialActiveThumbnailIds,
  selectedThumbnailIds,
  updateSelectedThumbnailIds,
  onSaveConfirmed,
  loading,
  exportButton,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { open, close, configure } = useDialog();

  const { data: personalizationConfigData } = useFindHomepageThumbnailPersonalization(
    universeId,
    true,
  );

  const { activeConfigId, activeConfigCreateDateUTC } = useMemo(() => {
    const activeConfig = personalizationConfigData?.personalizedConfigs?.[0];
    return {
      activeConfigId: activeConfig?.id,
      activeConfigCreateDateUTC: activeConfig ? new Date(activeConfig.createdUtc) : null,
    };
  }, [personalizationConfigData?.personalizedConfigs]);

  const { newlyUploadedThumbnailIds } = useNewlyUploadedThumbnailIdsContext();
  const hasNewlyUploadedThumbnails = newlyUploadedThumbnailIds.length > 0;

  const saveEvent = useMemo(() => {
    if (selectedThumbnailIds.every((id) => !initialActiveThumbnailIds.includes(id))) {
      // Every selected thumbnail is new, therefore need a new personalization config and reset data
      return SaveEvent.WillResetData;
    }

    if (selectedThumbnailIds.every((id) => initialActiveThumbnailIds.includes(id))) {
      if (selectedThumbnailIds.length < initialActiveThumbnailIds.length) {
        // Every selected thumbnail is old, but there are fewer of them, meaning user is about to deactivate some
        return SaveEvent.ThumbnailsAboutToDeactive;
      }
      return hasNewlyUploadedThumbnails ? SaveEvent.PromptToActivateThumbnails : SaveEvent.None;
    }

    return SaveEvent.WillKeepPartialData;
  }, [hasNewlyUploadedThumbnails, initialActiveThumbnailIds, selectedThumbnailIds]);

  const { resetOrCreateThumbnailPersonalization } =
    useCreateHomepageThumbnailPersonalizationMutation(universeId, true);
  const { updateThumbnailPersonalization } = useUpdateHomepageThumbnailPersonalizationMutation(
    universeId,
    true,
  );

  const onCancelChange = useCallback(() => {
    updateSelectedThumbnailIds(initialActiveThumbnailIds);
  }, [initialActiveThumbnailIds, updateSelectedThumbnailIds]);

  const onPrimaryDialogButtonClick = useCallback(() => {
    switch (saveEvent) {
      case SaveEvent.WillResetData:
        resetOrCreateThumbnailPersonalization(selectedThumbnailIds);
        close();
        onSaveConfirmed();
        break;
      case SaveEvent.WillKeepPartialData:
      case SaveEvent.ThumbnailsAboutToDeactive:
        if (!activeConfigId) {
          throw new Error(`no active config id found when thumbnails are about to ${saveEvent}`);
        }
        updateThumbnailPersonalization({
          personalizedConfigId: activeConfigId,
          thumbnailIds: selectedThumbnailIds,
        });
        close();
        onSaveConfirmed();
        break;
      case SaveEvent.PromptToActivateThumbnails:
        close();
        break;
      case SaveEvent.None:
        break;
      default: {
        const exhaustiveCheck: never = saveEvent;
        throw new Error(`Unhandled save event: ${exhaustiveCheck}`);
      }
    }
  }, [
    activeConfigId,
    close,
    onSaveConfirmed,
    resetOrCreateThumbnailPersonalization,
    saveEvent,
    selectedThumbnailIds,
    updateThumbnailPersonalization,
  ]);

  const onSecondaryDialogButtonClick = useCallback(() => {
    switch (saveEvent) {
      case SaveEvent.WillResetData:
      case SaveEvent.WillKeepPartialData:
      case SaveEvent.ThumbnailsAboutToDeactive:
        close();
        break;
      case SaveEvent.PromptToActivateThumbnails:
        close();
        onSaveConfirmed();
        break;
      case SaveEvent.None:
        break;
      default: {
        const exhaustiveCheck: never = saveEvent;
        throw new Error(`Unhandled save event: ${exhaustiveCheck}`);
      }
    }
  }, [close, onSaveConfirmed, saveEvent]);

  const confirmationDialog = useMemo(() => {
    switch (saveEvent) {
      case SaveEvent.WillKeepPartialData:
      case SaveEvent.WillResetData:
        return (
          <WillStartNewTestDialog
            lastDataResetDateUTC={activeConfigCreateDateUTC}
            exportButton={exportButton}
            onPrimaryButtonClick={onPrimaryDialogButtonClick}
            onSecondaryButtonClick={onSecondaryDialogButtonClick}
          />
        );
      case SaveEvent.ThumbnailsAboutToDeactive:
        return (
          <ThumbnailsAboutToDeactiveDialog
            onPrimaryButtonClick={onPrimaryDialogButtonClick}
            onSecondaryButtonClick={onSecondaryDialogButtonClick}
          />
        );
      case SaveEvent.PromptToActivateThumbnails:
        return (
          <PromptToActivateThumbnailsDialog
            onPrimaryButtonClick={onPrimaryDialogButtonClick}
            onSecondaryButtonClick={onSecondaryDialogButtonClick}
          />
        );
      case SaveEvent.None:
        return null;
      default: {
        const exhaustiveCheck: never = saveEvent;
        throw new Error(`Unhandled save event: ${exhaustiveCheck}`);
      }
    }
  }, [
    saveEvent,
    activeConfigCreateDateUTC,
    exportButton,
    onPrimaryDialogButtonClick,
    onSecondaryDialogButtonClick,
  ]);

  const onClick = useCallback(() => {
    switch (saveEvent) {
      case SaveEvent.WillKeepPartialData:
      case SaveEvent.ThumbnailsAboutToDeactive:
      case SaveEvent.PromptToActivateThumbnails:
        configure(confirmationDialog, {
          maxWidth: 'Medium',
        });
        open();
        break;
      case SaveEvent.WillResetData:
        if (selectedThumbnailIds.length === 1) {
          // We don't want to show 'will reset data' dialog when there's only one thumbnail selected
          // because one active thumbnail means no personlization is turned on from user's perspective
          // even though we need to create a new personalization config for it.
          //
          // This may happen right after user uploads their first thumbnail
          resetOrCreateThumbnailPersonalization(selectedThumbnailIds);
          onSaveConfirmed();
        } else {
          configure(confirmationDialog, {
            maxWidth: 'Medium',
          });
          open();
        }
        break;
      case SaveEvent.None:
        // If there is no change, we can skip the confirmation dialog and cancel the change
        onCancelChange();
        onSaveConfirmed();
        break;
      default: {
        const exhaustiveCheck: never = saveEvent;
        throw new Error(`Unhandled save event: ${exhaustiveCheck}`);
      }
    }
  }, [
    saveEvent,
    configure,
    confirmationDialog,
    open,
    selectedThumbnailIds,
    onCancelChange,
    onSaveConfirmed,
    resetOrCreateThumbnailPersonalization,
  ]);

  const shouldDisableButton = selectedThumbnailIds.length === 0;
  const tooltip = useMemo(() => {
    return shouldDisableButton
      ? translate(
          translationKey('Description.CheckMoreThumbnail', TranslationNamespace.PlaceThumbnails),
        )
      : undefined;
  }, [shouldDisableButton, translate]);

  return (
    <Tooltip title={tooltip}>
      <span>
        <Button
          variant='contained'
          onClick={onClick}
          disableRipple
          loading={loading}
          disabled={shouldDisableButton}>
          {translate(translationKey('Label.SaveChange', TranslationNamespace.PlaceThumbnails))}
        </Button>
      </span>
    </Tooltip>
  );
};

export default SaveChangeButton;
