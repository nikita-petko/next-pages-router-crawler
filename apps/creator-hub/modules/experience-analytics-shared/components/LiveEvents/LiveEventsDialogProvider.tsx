import React, { FC, useMemo } from 'react';
import { RecommendedEventType } from '@modules/clients/analytics';

type TUseLiveEventsDialogContext = {
  defaultEventType: RecommendedEventType;
};

export const LiveEventsDialogContext = React.createContext<TUseLiveEventsDialogContext>({
  defaultEventType: RecommendedEventType.Invalid,
});

export const useLiveEventsDialog = (): TUseLiveEventsDialogContext => {
  const context = React.useContext(LiveEventsDialogContext);
  if (!context) {
    throw new Error('useLiveEventsDialog must be used within a LiveEventsDialogProvider');
  }
  return context;
};

const LiveEventsDialogProvider: FC<
  React.PropsWithChildren<{ defaultEventType: RecommendedEventType }>
> = ({ children, defaultEventType }) => {
  const bundle = useMemo(
    () => ({
      defaultEventType,
    }),
    [defaultEventType],
  );

  return (
    <LiveEventsDialogContext.Provider value={bundle}>{children}</LiveEventsDialogContext.Provider>
  );
};

export default LiveEventsDialogProvider;
