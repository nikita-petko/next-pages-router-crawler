import { IPFamilyStatusReasonEnum } from '@rbx/clients/rightsV1';

// getIpFamilyStatusReason returns the translated reason for the IP family status. Assumes translate has access
// to the Rights Portal translation keys.
const getIpFamilyStatusReason = (
  reason: IPFamilyStatusReasonEnum,
  translate: (key: string) => string,
): string => {
  switch (reason) {
    case IPFamilyStatusReasonEnum.InvalidRegistration:
      return translate('Message.InvalidRegistration');
    case IPFamilyStatusReasonEnum.UnverifiedOwnership:
      return translate('Message.UnverifiedOwnership');
    case IPFamilyStatusReasonEnum.RequirementsUnmet:
      return translate('Message.RequirementsUnmet');
    default:
      return '';
  }
};

export default getIpFamilyStatusReason;
