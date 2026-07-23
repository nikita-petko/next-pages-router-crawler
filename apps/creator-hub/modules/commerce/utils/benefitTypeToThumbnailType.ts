import { GrantableType } from '@rbx/client-commerce-api/v1';
import { ThumbnailTypes } from '@rbx/thumbnails';

// // TODO(@rpatel, 12/06/24): Fix linter default export + corresponding errors in associated files that import.
export const grantableTypeToThumbnailType: { [key in GrantableType]: ThumbnailTypes } = {
  [GrantableType.AvatarItem]: ThumbnailTypes.assetThumbnail,
  [GrantableType.DeveloperProduct]: ThumbnailTypes.developerProductIcon,
  [GrantableType.Invalid]: ThumbnailTypes.assetThumbnail,
  [GrantableType.Bundle]: ThumbnailTypes.bundleThumbnail,
};
