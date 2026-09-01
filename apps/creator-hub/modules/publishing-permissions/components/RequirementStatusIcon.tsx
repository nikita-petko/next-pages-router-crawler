import type { FunctionComponent } from 'react';
import { CheckCircleOutlineIcon, ErrorOutlineOutlinedIcon, RemoveIcon } from '@rbx/ui';

const RequirementStatusIcon: FunctionComponent<{
  isRequired: boolean;
  isCompleted: boolean;
  isEnabled: boolean;
}> = ({ isRequired, isCompleted, isEnabled }) => {
  if (!isRequired) {
    return <RemoveIcon />;
  }
  if (isCompleted) {
    return <CheckCircleOutlineIcon color='success' />;
  }
  if (!isEnabled) {
    return <ErrorOutlineOutlinedIcon color='disabled' />;
  }
  return <ErrorOutlineOutlinedIcon color='error' />;
};

export default RequirementStatusIcon;
