import { FunctionComponent } from 'react';
import { CheckCircleOutlineIcon, CancelOutlinedIcon, RemoveIcon } from '@rbx/ui';
import { RequirementStatus } from '../types';

const RequirementStatusIcon: FunctionComponent<{
  status: RequirementStatus;
  isCompleted: boolean;
}> = ({ status, isCompleted }) => {
  if (status === RequirementStatus.NotRequired) {
    return <RemoveIcon />;
  }
  if (isCompleted) {
    return <CheckCircleOutlineIcon color='success' />;
  }
  return <CancelOutlinedIcon color='error' />;
};

export default RequirementStatusIcon;
