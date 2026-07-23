import { DisputeReasonEnum } from '@rbx/clients/rightsV1';

const disputeReasontoString = (
  reason: DisputeReasonEnum,
  translate: (key: string) => string,
): string => {
  switch (reason) {
    case DisputeReasonEnum.Original:
      return translate('Description.DisputeReasonOriginal');
    case DisputeReasonEnum.Licensed:
      return translate('Description.DisputeReasonLicensed');
    case DisputeReasonEnum.FairUse:
      return translate('Description.DisputeReasonFair');
    case DisputeReasonEnum.IpRemoved:
      return translate('Description.DisputeReasonRemoved');
    case DisputeReasonEnum.Other:
    default:
      return translate('Description.DisputeReasonOther');
  }
};

export default disputeReasontoString;
