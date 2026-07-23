import { useCallback } from 'react';
import { TableValueTypes, ColumnType, Status } from '@modules/charts-generic';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PersonalizedThumbnail } from '@modules/react-query/thumbnailPersonalization';
import { ModerationStatus } from '@rbx/clients/thumbnailPersonalizationApi';

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
