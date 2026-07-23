import type { FC } from 'react';
import React, { useCallback } from 'react';
import type { TButtonProps } from '@rbx/ui';
import RecommendedEventsLiveEventsDialogContainer from '@modules/experience-analytics-shared/components/LiveEvents/Dialog/RecommendedEventsLiveEventsDialogContainer';
import { useLiveEventsDialog } from '@modules/experience-analytics-shared/components/LiveEvents/LiveEventsDialogProvider';
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
    <>
      <LiveEventsButton onClick={openLiveEventsDialog} showRecordIcon={showRecordIcon} {...props} />
      <RecommendedEventsLiveEventsDialogContainer
        open={liveEventsDialogOpen}
        onClose={closeLiveEventsDialog}
        defaultEventType={defaultEventType}
      />
    </>
  );
};

export default LiveEventsButtonWithDialog;
