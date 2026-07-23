import { useCallback } from 'react';
import { ModerationStatus } from '@rbx/client-thumbnail-personalization-api/v1';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { TableValueTypes } from '@modules/charts-generic/tables/types/GenericTableType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { PersonalizedThumbnail } from '@modules/react-query/thumbnailPersonalization';

const maxAllowedActiveThumbnails = 5;
const minAllowedActiveThumbnails = 1;

const useCreateThumbnailSelectionCellData = (
  selectedThumbnailIds: string[],
  updateSelectedThumbnailIds: React.Dispatch<React.SetStateAction<string[]>>,
  isUserViewAnalyticsOnly?: boolean,
): ((thumbnail: PersonalizedThumbnail) => TableValueTypes[ColumnType.Selection]) => {
  const { translate } = useTranslationWrapper(useTranslation());

  return useCallback(
    (thumbnail: PersonalizedThumbnail) => {
      const { id, moderationStatus, isThumbnailSpammy } = thumbnail;
      const isSelected = selectedThumbnailIds.includes(id);

      const hasReachedMaxAllowedActiveThumbnails =
        selectedThumbnailIds.length === maxAllowedActiveThumbnails;
      const hasReachedMinAllowedActiveThumbnails =
        selectedThumbnailIds.length === minAllowedActiveThumbnails;

      let checkboxTooltip: string | undefined;
      let disabled = false;
      if (isUserViewAnalyticsOnly) {
        checkboxTooltip = translate(
          translationKey('Description.Table.NoPermissionToUpdate', TranslationNamespace.Analytics),
        );
        disabled = true;
      } else if (hasReachedMaxAllowedActiveThumbnails && !isSelected) {
        checkboxTooltip = translate(
          translationKey('Description.Table.MaxActiveThumbnails', TranslationNamespace.Analytics),
          {
            limit: maxAllowedActiveThumbnails.toString(),
          },
        );
        disabled = true;
      } else if (hasReachedMinAllowedActiveThumbnails && isSelected) {
        checkboxTooltip = translate(
          translationKey('Description.Table.MinActiveThumbnails', TranslationNamespace.Analytics),
        );
        disabled = true;
      } else if (isThumbnailSpammy) {
        checkboxTooltip = translate(
          translationKey(
            'Description.Table.RejectedSpammyThumbnail',
            TranslationNamespace.Analytics,
          ),
        );
        disabled = true;
      } else if (moderationStatus === ModerationStatus.Rejected) {
        checkboxTooltip = translate(
          translationKey('Description.Table.RejectedThumbnail', TranslationNamespace.Analytics),
        );
        disabled = true;
      } else if (moderationStatus === ModerationStatus.Reviewing) {
        checkboxTooltip = translate(
          translationKey('Description.Table.ReviewingThumbnail', TranslationNamespace.Analytics),
        );
        disabled = true;
      }

      return {
        type: ColumnType.Selection,
        rowKey: id,
        checked: isSelected,
        disabled,
        onChange: (rowKey: string, checked: boolean) => {
          updateSelectedThumbnailIds((selectedRows) =>
            checked ? [...selectedRows, id] : selectedRows.filter((value) => value !== id),
          );
        },
        tooltip: checkboxTooltip,
      };
    },
    [isUserViewAnalyticsOnly, selectedThumbnailIds, translate, updateSelectedThumbnailIds],
  );
};

export default useCreateThumbnailSelectionCellData;
