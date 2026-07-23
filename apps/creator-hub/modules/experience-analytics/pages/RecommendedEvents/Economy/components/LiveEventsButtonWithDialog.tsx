import React, { FC, useCallback } from 'react';
import {
  RecommendedEventsLiveEventsDialogContainer,
  useLiveEventsDialog,
} from '@modules/experience-analytics-shared';
import { TButtonProps } from '@rbx/ui';
import LiveEventsButton from './LiveEventsButton';

const LiveEventsButtonWithDialog: FC<TButtonProps & { showRecordIcon?: boolean }> = ({
  showRecordIcon = true,
  ...props
}) => {
  const { defaultEventType } = useLiveEventsDialog();

  const [liveEventsDialogOpen, setLiveEventsDialogOpen] = React.useState(false);
  const openLiveEventsDialog = useCallback(() => setLiveEventsDialogOpen(true), []);
  const closeLiveEventsDialog = useCallback(() => setLiveEventsDialogOpen(false), []);

  return (
    <React.Fragment>
      <LiveEventsButton onClick={openLiveEventsDialog} showRecordIcon={showRecordIcon} {...props} />
      <RecommendedEventsLiveEventsDialogContainer
        open={liveEventsDialogOpen}
        onClose={closeLiveEventsDialog}
        defaultEventType={defaultEventType}
      />
    </React.Fragment>
  );
};

export default LiveEventsButtonWithDialog;
