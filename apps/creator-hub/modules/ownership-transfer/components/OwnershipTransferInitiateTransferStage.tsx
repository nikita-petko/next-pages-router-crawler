import React, { Fragment } from 'react';
import OwnershipTransferOwnerSelection from './OwnershipTransferOwnerSelection';
import OwnershipTransferVerification from './OwnershipTransferVerification';
import { TModalStageComponentProps } from '../transferConfiguration';

type TOwnershipTransferInitiateTransferStageProps = TModalStageComponentProps;

const OwnershipTransferInitiateTransferStage = ({
  resource,
}: TOwnershipTransferInitiateTransferStageProps) => {
  return (
    <Fragment>
      <OwnershipTransferOwnerSelection resource={resource} />
      <OwnershipTransferVerification resource={resource} />
    </Fragment>
  );
};

export default OwnershipTransferInitiateTransferStage;
