import { Fragment } from 'react';
import type { TModalStageComponentProps } from '../types';
import OwnershipTransferOwnerSelection from './OwnershipTransferOwnerSelection';
import OwnershipTransferVerification from './OwnershipTransferVerification';

type TOwnershipTransferInitiateTransferStageProps = TModalStageComponentProps;

const OwnershipTransferInitiateTransferStage = ({
  resource,
}: TOwnershipTransferInitiateTransferStageProps) => {
  return (
    <>
      <OwnershipTransferOwnerSelection resource={resource} />
      <OwnershipTransferVerification resource={resource} />
    </>
  );
};

export default OwnershipTransferInitiateTransferStage;
