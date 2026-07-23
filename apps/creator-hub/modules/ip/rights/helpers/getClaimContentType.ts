import { ClaimContentContentTypeEnum } from '@rbx/clients/rightsV1';

const contentTypeToClaimContentType = (contentType: string): ClaimContentContentTypeEnum => {
  switch (contentType) {
    case 'Asset':
      return ClaimContentContentTypeEnum.Asset;
    case 'Bundle':
      return ClaimContentContentTypeEnum.Bundle;
    default:
      return ClaimContentContentTypeEnum.External;
  }
};

export default contentTypeToClaimContentType;
