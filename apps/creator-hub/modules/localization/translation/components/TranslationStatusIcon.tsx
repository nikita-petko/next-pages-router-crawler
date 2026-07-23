import React, { FunctionComponent } from 'react';
import { CheckIcon, CircularProgress, ScheduleIcon } from '@rbx/ui';
import TranslationStatus from '../enums/TranslationStatus';

export interface TranslationStatusIconProps {
  isLoading: boolean;
  status: TranslationStatus | null;
}

const TranslationStatusIcon: FunctionComponent<
  React.PropsWithChildren<TranslationStatusIconProps>
> = ({ isLoading, status }) => {
  if (isLoading) {
    return <CircularProgress size={12} thickness={5} />;
  }
  if (status === TranslationStatus.Done) {
    return <CheckIcon fontSize='small' />;
  }
  return <ScheduleIcon fontSize='small' />;
};

export default TranslationStatusIcon;
