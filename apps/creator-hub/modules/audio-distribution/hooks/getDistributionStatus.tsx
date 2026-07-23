export enum EDistributionStatus {
  NotStarted = 0,
  Pending = 1,
  Approved = 2,
  Failed = 3,
}

export const getDistributionStatus = (isIdVerified: boolean, isTosSigned: boolean) => {
  return isIdVerified && isTosSigned
    ? EDistributionStatus.Approved
    : EDistributionStatus.NotStarted;
};

export default getDistributionStatus;
