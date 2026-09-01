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
  // Increment on each open so the container remounts with fresh state,
  // ensuring the dropdown always resets to the page's defaultEventType.
  const [openKey, setOpenKey] = React.useState(0);
  const openLiveEventsDialog = useCallback(() => {
    setOpenKey((k) => k + 1);
    setLiveEventsDialogOpen(true);
  }, []);
  const closeLiveEventsDialog = useCallback(() => setLiveEventsDialogOpen(false), []);

  return (
    <>
      <LiveEventsButton onClick={openLiveEventsDialog} showRecordIcon={showRecordIcon} {...props} />
      <RecommendedEventsLiveEventsDialogContainer
        key={openKey}
        open={liveEventsDialogOpen}
        onClose={closeLiveEventsDialog}
        defaultEventType={defaultEventType}
      />
    </>
  );
};

export default LiveEventsButtonWithDialog;
