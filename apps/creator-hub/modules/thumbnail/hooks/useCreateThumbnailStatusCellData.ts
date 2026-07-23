import { useCallback } from 'react';
import { ModerationStatus } from '@rbx/client-thumbnail-personalization-api/v1';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { TableValueTypes } from '@modules/charts-generic/tables/types/GenericTableType';
import { Status } from '@modules/charts-generic/tables/types/GenericTableType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { PersonalizedThumbnail } from '@modules/react-query/thumbnailPersonalization';

const useCreateThumbnailStatusCellData = (): ((
  thumbnail: PersonalizedThumbnail,
) => TableValueTypes[ColumnType.Status]) => {
  const { translate } = useTranslationWrapper(useTranslation());

  return useCallback(
    (thumbnail: PersonalizedThumbnail) => {
      const { active, moderationStatus, isThumbnailSpammy } = thumbnail;

      if (isThumbnailSpammy) {
        return {
          type: ColumnType.Status,
          chipType: 'icon',
          preset: Status.Error,
          label: translate(translationKey('Label.Status.Rejected', TranslationNamespace.Analytics)),
        };
      }

      switch (moderationStatus) {
        case ModerationStatus.Rejected:
          return {
            type: ColumnType.Status,
            chipType: 'icon',
            preset: Status.Error,
            label: translate(
              translationKey('Label.Status.Rejected', TranslationNamespace.Analytics),
            ),
          };
        case ModerationStatus.Reviewing:
          return {
            type: ColumnType.Status,
            chipType: 'icon',
            preset: Status.Warning,
            label: translate(
              translationKey('Label.Status.InReview', TranslationNamespace.Analytics),
            ),
          };
        case ModerationStatus.Unspecified:
        case ModerationStatus.Approved:
          return {
            type: ColumnType.Status,
            chipType: 'icon',
            preset: active ? Status.Success : Status.Disabled,
            label: translate(
              active
                ? translationKey('Label.Status.Active', TranslationNamespace.Analytics)
                : translationKey('Label.Status.Inactive', TranslationNamespace.Analytics),
            ),
          };
        default: {
          const exhaustiveCheck: never = moderationStatus;
          throw new Error(`Unhandled moderation status: ${exhaustiveCheck}`);
        }
      }
    },
    [translate],
  );
};

export default useCreateThumbnailStatusCellData;
