import { rightsClient } from '@modules/clients';
import { ClaimContentContentTypeEnum } from '@rbx/clients/rightsV1';
import { useMutation } from '@tanstack/react-query';
import parseContentUrl, { ContentURLType } from '../helpers/parseContentUrl';

export const ContentCheckStatusOK = 'No error.';

export interface ContentInfo {
  contentId: number;
  contentType: ClaimContentContentTypeEnum;
}

export default function useContentPermissions() {
  const submitHandler = async (value: string) => {
    const parsedMyContentUrl = parseContentUrl(value, ContentURLType.Original);
    if (
      parsedMyContentUrl.error.length ||
      (parsedMyContentUrl.contentType !== ClaimContentContentTypeEnum.Asset &&
        parsedMyContentUrl.contentType !== ClaimContentContentTypeEnum.Bundle)
    ) {
      return false;
    }

    const response = await rightsClient.checkContentPermissions(
      [String(parsedMyContentUrl.contentId)],
      parsedMyContentUrl.contentType,
    );
    const permissions = (response?.results || null) as Record<number, string>;
    return permissions?.[parsedMyContentUrl.contentId] === ContentCheckStatusOK;
  };

  return useMutation({
    mutationFn: submitHandler,
  });
}
