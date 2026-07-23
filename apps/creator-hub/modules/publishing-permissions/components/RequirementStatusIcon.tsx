import type { FunctionComponent } from 'react';
import { CheckCircleOutlineIcon, ErrorOutlineOutlinedIcon, RemoveIcon } from '@rbx/ui';
import { RequirementStatus } from '../types';

const RequirementStatusIcon: FunctionComponent<{
  status: RequirementStatus;
  isCompleted: boolean;
  comingSoon?: boolean;
}> = ({ status, isCompleted, comingSoon }) => {
  if (status === RequirementStatus.NotRequired) {
    return <RemoveIcon />;
  }
  if (isCompleted) {
    return <CheckCircleOutlineIcon color='success' />;
  }
  if (comingSoon) {
    return <ErrorOutlineOutlinedIcon color='disabled' />;
  }
  return <ErrorOutlineOutlinedIcon color='error' />;
};

export default RequirementStatusIcon;
