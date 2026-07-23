import type { IPContent } from '@rbx/client-rights/v1';
import { IPContentContentTypeEnum } from '@rbx/client-rights/v1';
import { SupportedRobloxAssetTypeEnum } from '../constants';

const getIpContentTypeTranslationKey = (
  ipContent: IPContent,
  { granularTrademark = false }: { granularTrademark?: boolean } = {},
): string | undefined => {
  if (ipContent.trademarkContent) {
    if (!granularTrademark) {
      return 'Label.Trademark';
    }
    return ipContent.contentType === IPContentContentTypeEnum.Text
      ? 'Label.TextTrademark'
      : 'Label.ImageTrademark';
  }
  switch (ipContent.contentType) {
    case IPContentContentTypeEnum.Text:
      return ipContent.isPrimary ? 'Label.PrimaryKeyword' : 'Label.SecondaryKeyword';
    case IPContentContentTypeEnum.Image:
      return 'Label.Image';
    case IPContentContentTypeEnum.Asset:
      switch (ipContent.robloxAssetType) {
        case SupportedRobloxAssetTypeEnum.Image:
          return 'Label.Image';
        case SupportedRobloxAssetTypeEnum.Decal:
          return 'Label.Decal';
        case SupportedRobloxAssetTypeEnum.Mesh:
          return 'Label.Mesh';
        case SupportedRobloxAssetTypeEnum.MeshPart:
          return 'Label.MeshPart';
        case undefined:
        default:
          return undefined;
      }
    case undefined:
    default:
      return undefined;
  }
};

export default getIpContentTypeTranslationKey;
